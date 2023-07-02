import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pgDb } from '../../utils/db.mjs';
import promisifyRedisClient from '../../utils/promisifyRedis.mjs';

const registerUserService = async (input) => {
  // console.log(input);
  // console.log(process.env.JWT_SECRET);
  try {
    const { username, password } = input;
    const userId = uuidv4(); // use uuid instead of int

    // SELECT EXISTS  more efficient than SELECT *
    const userExists = await pgDb.query(
      'SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)',
      [username],
    );
    if (userExists.rows[0].exists) {
      throw new Error(`Username ${username} already exists`);
    }

    // Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // register user
    const user = await pgDb.query(
      'INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING id, username',
      [userId, username, hashedPassword],
    );

    // console.log(user.rows[0]);

    return user.rows[0]; // return id and username
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to register user');
  }
};

const loginService = async (input) => {
  const { username, password } = input;
  // console.log(input);
  try {
    // Check if user exists
    const user = await pgDb.query(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );
    if (user.rows.length === 0) {
      console.log('wrong username');
      throw new Error('Invalid username or password');
    }
    // Check if password matches hash pw using bcrypt
    const passwordMatch = await bcrypt.compare(
      password,
      user.rows[0].password,
    );
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    // Generate a JWT token for authentication
    const payload = {
      userId: user.rows[0].id,
      username: user.rows[0].username,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // console.log(user.rows[0].username);
    // console.log(token);
    return {
      username,
      token,
    };
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to login');
  }
};

const updateUserService = async (id, input) => {
  // console.log(input);
  try {
    const {
      username, password, firstName, lastName,
    } = input;

    // check if user exists
    const userExists = await pgDb.query(
      'SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)',
      [id],
    );
    if (!userExists.rows[0].exists) {
      throw new Error(`User id: ${id} not found`);
    }

    const user = await pgDb.query(
      'UPDATE users SET username = $1, password = $2, firstName = $3, lastName = $4 '
      + 'WHERE id = $5 RETURNING  username, firstName, lastName',
      [username, password, firstName, lastName, id],
    );

    // if (!user.rows.length) {
    //     throw new Error(`User id: ${id} not found`);
    // }

    // console.log(user.rows[0]);
    return user.rows[0];
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to update user');
  }
};

// retrieve user
const getUserService = async (id, req, redis) => {
  // console.log(req.headers.authorization);
  const { redisGetAsync, redisSetAsync } = promisifyRedisClient(redis);

  try {
    if (!req.user) {
      throw new Error('Unauthorized');
    }

    const userId = req.user.id;
    // compare the user ID from jwt payload to input user id
    if (userId.toString() !== id) {
      throw new Error('Unauthorized: JWT token User ID does not match');
    }

    const redisKey = `user:${id}`;
    // Check if the user is in the Redis cache
    const cachedUser = await redisGetAsync(redisKey);
    if (cachedUser) {
      console.log('Found user in Redis cache');
      return JSON.parse(cachedUser);
    }
    // User not found in Redis cache; retrieve from Postgres
    console.log('User not found in Redis cache; retrieving from Postgres');
    const user = await pgDb.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );

    if (!user) {
      throw new Error(`User id: ${id} not found`);
    }

    // Store user to the Redis cache for future requests
    await redisSetAsync(redisKey, JSON.stringify(user.rows[0]), 'EX', 3600); // EX set 1 hour to expire

    console.log('Authorized for getUser resolver');
    return user.rows[0]; // return first row of the user result
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to get user');
  }
};
// retrieve all users
const getAllUsersService = async () => {
  try {
    const users = await pgDb.query('SELECT * FROM users');

    return users.rows;
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to get all users');
  }
};
export {
  getUserService,
  getAllUsersService,
  registerUserService,
  loginService,
  updateUserService,
};
