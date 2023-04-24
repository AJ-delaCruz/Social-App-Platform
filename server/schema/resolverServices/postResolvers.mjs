import { v4 as uuidv4 } from 'uuid';
import { producer } from '../../kafka-server/kafkaClient.mjs';

const postResolvers = {
  Query: {
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
  },
  Mutation: {
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

        // Publish a message to Kafka topic 'posts' after user creates a post
        await producer.send({
          topic: 'posts',
          messages: [
            {
              value: JSON.stringify({
                // convert to JSON string
                id,
                userId,
                body,
                createdAt,
              }),
            },
          ],
        });

        // Return the new post object
        return {
          id,
          userId,
          body,
          createdAt,
        };
      } catch (err) {
        console.error(err);
        throw new Error('Failed to create post');
      }
    },
  },
};

export default postResolvers;
