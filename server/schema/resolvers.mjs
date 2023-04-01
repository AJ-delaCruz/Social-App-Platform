import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const resolvers = {
  Query: {
    // retrieve user
    async getUser(_, args, { pgdb, req }) {
      console.log(req.headers.authorization);
      try {
        // Authenticate the user
        // const authUser = await authenticateUser(req);
        // req.user = authUser;
        // console.log(req.user);
        //
        // const { id } = args;
        // // console.log(args);
        // console.log(`getUserId: ${id}`);
        //
        // // Extract the userId from the JWT payload
        // const userId = authUser.id;
        // console.log(`jwt userId: ${userId}`);
        // console.log(`getUserId: ${id} (type: ${typeof id})`);
        // console.log(`jwt userId: ${userId} (type: ${typeof userId})`);

        // // Check that the userId from the JWT payload matches the ID passed in as an argument
        // if (userId.toString() !== id) {
        //   throw new Error('Unauthorized');
        // }
        // console.log(req.user);
        if (!req.user) {
          throw new Error('Unauthorized');
        }

        const { id } = args;
        console.log(`getUserId: ${id}`);

        const userId = req.user.id;
        console.log(`jwt userId: ${userId}`);

        // compare the user ID from jwt payload to input user id
        if (userId.toString() !== id) {
          throw new Error('Unauthorized: JWT token User ID does not match');
        }

        const user = await pgdb.query('SELECT * FROM users WHERE id = $1', [id]);

        if (!user) {
          throw new Error(`User id: ${id} not found`);
        }

        console.log('Authorized for getUser resolver');
        return user.rows[0]; // return first row of the user result
      } catch (err) {
        console.error(err);
        throw new Error('Failed to get user');
      }
    },
    // retrieve all users
    async getAllUsers(_, __, { pgdb }) {
      try {
        const users = await pgdb.query('SELECT * FROM users');

        return users.rows;
      } catch (err) {
        console.error(err);
        throw new Error('Failed to get all users');
      }
    },
  },

  Mutation: {

    async registerUser(_, { input }, { pgdb }) {
      console.log(input);
      console.log(process.env.JWT_SECRET);
      try {
        const { username, password } = input;

        // SELECT EXISTS  more efficient than SELECT *
        const userExists = await pgdb.query('SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)', [username]);
        if (userExists.rows[0].exists) {
          throw new Error(`Username ${username} already exists`);
        }

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // register user
        const user = await pgdb.query('INSERT INTO users (username, password) VALUES ($1, $2) '
                    + 'RETURNING id, username', [username, hashedPassword]);

        // // Generate a JWT token for authentication
        const payload = { userId: user.rows[0].id, username: user.rows[0].username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: '1d',
        });

        console.log(user.rows[0]);
        console.log(token);
        return { user: user.rows[0], token };
      } catch (err) {
        console.error(err);
        throw new Error('Failed to register user');
      }
    },

    async login(_, { input }, { pgdb }) {
      const { username, password } = input;
      console.log(input);
      try {
        // Check if user exists
        const user = await pgdb.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
          console.log('wrong username');
          throw new Error('Invalid username or password');
        }
        // Check if password matches hash pw using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!passwordMatch) {
          throw new Error('Invalid password');
        }

        // Generate a JWT token for authentication
        const payload = { userId: user.rows[0].id, username: user.rows[0].username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: '1d',
        });

        console.log(user.rows[0].username);
        console.log(token);
        return {
          username,
          token,
        };
      } catch (err) {
        console.error(err);
        throw new Error('Failed to login');
      }
    },

    async updateUser(_, { id, input }, { pgdb }) {
      console.log(input);
      try {
        const {
          username, password, firstName, lastName,
        } = input;

        // check if user exists
        const userExists = await pgdb.query('SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)', [id]);
        if (!userExists.rows[0].exists) {
          throw new Error(`User id: ${id} not found`);
        }

        const user = await pgdb.query('UPDATE users SET username = $1, password = $2, firstName = $3, lastName = $4 '
                    + 'WHERE id = $5 RETURNING  username, firstName, lastName', [username, password, firstName, lastName, id]);

        // if (!user.rows.length) {
        //     throw new Error(`User id: ${id} not found`);
        // }

        console.log(user.rows[0]);
        return user.rows[0];
      } catch (err) {
        console.error(err);
        throw new Error('Failed to update user');
      }
    },
    async createPost(_, { userId, body }, { cassandra }) {
      // console.log(cassandra.types.Uuid.random());

      try {
        // Generate ID using UUID v4
        const id = uuidv4();
        console.log(id);
        // Get the current timestamp for the post creation time
        const createdAt = new Date().toISOString();
        // query to insert the post into Cassandra
        const query = 'INSERT INTO posts (id, user_id, body, created_at) VALUES (?, ?, ?, ?)';
        // parameters for the query
        const params = [id, userId, body, createdAt];
        // Execute the query using the Cassandra client
        await cassandra.execute(query, params, { prepare: true }); // prepare statement and cache

        // Return the new post object
        return {
          id, userId, body, createdAt,
        };
      } catch (err) {
        console.error(err);
        throw new Error('Failed to create post');
      }
    },
    async createComment(_, { postId, userId, body }, { cassandra }) {
      // Generate ID using UUID v4
      const id = uuidv4();
      // const id = cassandra.types.uuid();
      console.log(id);
      const createdAt = new Date().toISOString();

      // Execute the query using the Cassandra client in few lines
      await cassandra.execute(
        'INSERT INTO comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, postId, userId, body, createdAt],
        { prepare: true },
      );

      console.log('commenting');
      // Return the new comment object
      return {
        id, postId, userId, body, createdAt,
      };
    },

  },

};
export default resolvers;
