import { v4 as uuidv4 } from 'uuid';
import { producer } from '../../kafka-server/kafkaClient.mjs';
import { cassandra } from '../../utils/db.mjs';

const createCommentService = async (postId, userId, body) => {
  try {
    // Generate ID using UUID v4
    const id = uuidv4();
    // const id = cassandra.types.uuid();
    const createdAt = new Date().toISOString();

    // Execute the query using the Cassandra client in few lines
    await cassandra.execute(
      'INSERT INTO social_media.comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, postId, userId, body, createdAt],
      { prepare: true },
    );

    // Publish a message to Kafka topic 'comments' after user replies to a post
    await producer.send({
      topic: 'comments',
      messages: [
        {
          value: JSON.stringify({
            // convert to JSON string
            id,
            postId,
            userId,
            message: body,
            createdAt,
            type: 'COMMENT_CREATED',
          }),
        },
      ],
    });

    // console.log('commenting');
    // Return the new comment object
    return {
      id,
      postId,
      userId,
      body,
      createdAt,
    };
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to make comment');
  }
};

// retrieve comment using commend id
const getCommentService = async (args) => {
  try {
    const { id } = args;

    const query = 'SELECT * FROM social_media.comments WHERE id = ?';
    const result = await cassandra.execute(query, [id], { prepare: true });
    if (result.rows.length === 0) {
      throw new Error(`Comment with ID ${id} does not exist`);
    }
    // console.log(result.rows[0]);
    return result.rows[0];
  } catch (error) {
    // console.log(error);
    throw new Error('Failed to get comment');
  }
};

// retrieve all comments for post
const getCommentsForPostService = async (args) => {
  try {
    const { postId } = args;
    const query = 'SELECT * FROM social_media.comments WHERE post_id = ?';
    const result = await cassandra.execute(query, [postId], {
      prepare: true,
    });
    if (result.rows.length === 0) {
      throw new Error(`No comments found for post with ID ${postId}`);
    }
    // console.log(result.rows);
    return result.rows;
  } catch (error) {
    // console.log(error);
    throw new Error('Failed to get comments for post');
  }
};

export {
  getCommentService,
  getCommentsForPostService,
  createCommentService,
};
