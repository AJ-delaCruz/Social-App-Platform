import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addPostToNewsfeedService } from '../../schema/services/newsFeedService.mjs';
import { storeNotification } from '../../kafka-server/kafkaServices.mjs';
import { pgDb, cassandra } from '../../utils/db.mjs';

const router = express.Router();

// retrieve friends list of the user without redis
const getAllFriendsServiceForREST = async (userId) => {
  try {
    // Query to retrieve friends from the PostgreSQL database
    const query = 'SELECT friend_id FROM friends WHERE user_id = $1';
    const result = await pgDb.query(query, [userId]);

    // Extract friend IDs from the result
    const friendIds = result.rows.map(
      (row) => row.friend_id.toString(), // convert UUID object to string
    );

    return friendIds;
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to retrieve friends IDs');
  }
};

// baseline test for createPost using REST API before graphQL, redis, kafka
// database operations: 1 write + 1 read + (N+N) writes from newsfeed & notification for each friend
router.post('/createPost', async (req, res) => {
  const { userId, body } = req.body;

  if (!userId || !body) {
    return res.status(400).json('userId and body are required');
  }

  try {
    // Insert post to Cassandra
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const query = 'INSERT INTO social_media.posts (id, user_id, body, created_at) VALUES (?, ?, ?, ?)';
    const params = [id, userId, body, createdAt];
    await cassandra.execute(query, params, { prepare: true });

    // Distribute post to all friends' newsfeeds & notification
    const postData = {
      id,
      userId,
      message: body,
      createdAt,
    };
    const friendIds = await getAllFriendsServiceForREST(userId);

    // Add posts to newsfeed for all friends
    await Promise.all(friendIds.map((friendId) => addPostToNewsfeedService(friendId, postData)));
    // Store notifications for all friends
    await Promise.all(friendIds.map((friendId) => storeNotification(friendId, postData, 'POST_CREATED')));

    // Return the new post object
    return res.status(201).json(postData);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Failed to create post');
  }
});

export default router;
