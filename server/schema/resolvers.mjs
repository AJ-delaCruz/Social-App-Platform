import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { redis, pgDb } from '../utils/db.mjs';

const redisGetAsync = promisify(redis.get).bind(redis); // get redis method in a promise
const redisSetAsync = promisify(redis.set).bind(redis); // set redis method in a promise

const resolvers = {
  Query: {
    // retrieve user
    async getUser(_, args, { req }) {
      console.log(req.headers.authorization);
      try {
        if (!req.user) {
          throw new Error('Unauthorized');
        }

        const { id } = args;
        // console.log(`getUserId: ${id}`);
        const userId = req.user.id;
        // console.log(`jwt userId: ${userId}`);

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
        // User not found in cache; retrieve from Postgres
        console.log('User not found in Redis cache; retrieving from Postgres');
        const user = await pgDb.query('SELECT * FROM users WHERE id = $1', [id]);

        if (!user) {
          throw new Error(`User id: ${id} not found`);
        }

        // Store user to the Redis cache for future requests
        await redisSetAsync(redisKey, JSON.stringify(user.rows[0]), 'EX', 3600); // EX set 1 hour to expire

        console.log('Authorized for getUser resolver');
        return user.rows[0]; // return first row of the user result
      } catch (err) {
        console.error(err);
        throw new Error('Failed to get user');
      }
    },
    // retrieve all users
    async getAllUsers() {
      try {
        const users = await pgDb.query('SELECT * FROM users');

        return users.rows;
      } catch (err) {
        console.error(err);
        throw new Error('Failed to get all users');
      }
    },

    // retrieve post
    async getPost(_, args, { cassandra }) {
      console.log(args);

      try {
        const { id } = args;
        const query = 'SELECT * FROM social_media.posts WHERE id = ?';
        const result = await cassandra.execute(query, [id], { prepare: true });
        return result.rows[0];
      } catch (error) {
        console.log(error);
        throw new Error('Error getting post');
      }
    },

    // retrieve all posts
    async getAllPosts(_, __, { cassandra }) {
      try {
        const query = 'SELECT * FROM social_media.posts';
        const result = await cassandra.execute(query);
        if (result.rows.length === 0) {
          throw new Error('No posts found');
        }
        return result.rows;
      } catch (error) {
        console.log(error);
        throw new Error('Error getting all posts');
      }
    },

    // retrieve comment
    async getComment(_, args, { cassandra }) {
      console.log(args);

      try {
        const { id } = args;

        const query = 'SELECT * FROM social_media.comments WHERE id = ?';
        const result = await cassandra.execute(query, [id], { prepare: true });
        if (result.rows.length === 0) {
          throw new Error(`Comment with ID ${id} does not exist`);
        }
        console.log(result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.log(error);
        throw new Error('Failed to get comment');
      }
    },

    // retrieve all comments for post
    async getCommentsForPost(_, args, { cassandra }) {
      console.log(args);
      try {
        const { postId } = args;
        const query = 'SELECT * FROM social_media.comments WHERE post_id = ?';
        const result = await cassandra.execute(query, [postId], { prepare: true });
        if (result.rows.length === 0) {
          throw new Error(`No comments found for post with ID ${postId}`);
        }
        return result.rows;
      } catch (error) {
        console.log(error);
        throw new Error('Failed to get comments for post');
      }
    },

    // retrieve all comments; to display recent comments throughout
    async getAllComments(_, __, { cassandra }) {
      try {
        const query = 'SELECT * FROM social_media.comments';
        const result = await cassandra.execute(query);
        if (result.rows.length === 0) {
          throw new Error('No comments found');
        }
        return result.rows;
      } catch (error) {
        console.log(error);
        throw new Error('Failed to get all comments');
      }
    },

  },

  Mutation: {

    async registerUser(_, { input }) {
      console.log(input);
      console.log(process.env.JWT_SECRET);
      try {
        const { username, password } = input;

        // SELECT EXISTS  more efficient than SELECT *
        const userExists = await pgDb.query('SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)', [username]);
        if (userExists.rows[0].exists) {
          throw new Error(`Username ${username} already exists`);
        }

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // register user
        const user = await pgDb.query('INSERT INTO users (username, password) VALUES ($1, $2) '
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

    async login(_, { input }) {
      const { username, password } = input;
      console.log(input);
      try {
        // Check if user exists
        const user = await pgDb.query('SELECT * FROM users WHERE username = $1', [username]);
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

    async updateUser(_, { id, input }) {
      console.log(input);
      try {
        const {
          username, password, firstName, lastName,
        } = input;

        // check if user exists
        const userExists = await pgDb.query('SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)', [id]);
        if (!userExists.rows[0].exists) {
          throw new Error(`User id: ${id} not found`);
        }

        const user = await pgDb.query('UPDATE users SET username = $1, password = $2, firstName = $3, lastName = $4 '
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
        const query = 'INSERT INTO social_media.posts (id, user_id, body, created_at) VALUES (?, ?, ?, ?)';
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
      try {
        // Generate ID using UUID v4
        const id = uuidv4();
        // const id = cassandra.types.uuid();
        console.log(id);
        const createdAt = new Date().toISOString();

        // Execute the query using the Cassandra client in few lines
        await cassandra.execute(
          'INSERT INTO social_media.comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
          [id, postId, userId, body, createdAt],
          { prepare: true },
        );

        console.log('commenting');
        // Return the new comment object
        return {
          id, postId, userId, body, createdAt,
        };
      } catch (err) {
        console.error(err);
        throw new Error('Failed to make comment');
      }
    },

  },

};
export default resolvers;
