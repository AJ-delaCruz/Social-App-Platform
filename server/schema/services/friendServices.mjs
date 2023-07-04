import { v4 as uuidv4 } from 'uuid';
import { pgDb } from '../../utils/db.mjs';
import promisifyRedisClient from '../../utils/promisifyRedis.mjs';

// retrieve friends list of the user
const getAllFriendsService = async (userId, redis) => {
  const { redisGetAsync, redisSetAsync } = promisifyRedisClient(redis);

  try {
    const redisKey = `userFriends:${userId}`;
    // Check if the user is in the Redis cache
    const cachedFriends = await redisGetAsync(redisKey);
    if (cachedFriends) {
      console.log('Found user friends data in Redis cache');
      return JSON.parse(cachedFriends);
    }
    // retrieve from Postgres if not cached
    console.log('Friends not found in Redis cache; retrieving from Postgres');

    // Query to retrieve friends from the PostgreSQL database
    const query = 'SELECT friend_id FROM friends WHERE user_id = $1';
    const result = await pgDb.query(query, [userId]);

    // Extract friend IDs from the result
    const friendIds = result.rows.map(
      (row) => row.friend_id.toString(), // convert UUID object to string
    );
    // console.log(friendIds);

    // Store data to the Redis cache for future requests
    await redisSetAsync(redisKey, JSON.stringify(friendIds), 'EX', 86400); // 1 day expiration

    return friendIds;
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to retrieve friends IDs');
  }
};

// async getFriendRequests() {

//   // TODO: implement
// },

// request user to be added to friend's list
const sendFriendRequestService = async (userId, friendId, redis) => {
  // TODO: implement a pending friend request logic

  try {
    // Generate ID using UUID v4
    const id = uuidv4();
    // Get the current timestamp for the post creation time
    const createdAt = new Date().toISOString();

    // query to insert the friend into PostgreSQL
    const query = 'INSERT INTO social_media.friends (id, user_id, friend_id, created_at) VALUES ($1, $2, $3, $4)';
    // Execute the query using the PostgreSQL client
    await pgDb.query(query, [id, userId, friendId, createdAt]);

    // Invalidate the cache for user's friends list after adding
    const redisKey = `userFriends:${userId}`;
    await redis.del(redisKey);

    // Return the friend object
    return {
      id,
      userId,
      friendId,
      createdAt,
    };
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to add friend');
  }
};

const removeFriendService = async (userId, friendId, redis) => {
  try {
    // Check if friendId exists in the user's friends list
    const checkQuery = 'SELECT id FROM friends WHERE user_id = $1 AND friend_id = $2';
    const checkResult = await pgDb.query(checkQuery, [userId, friendId]);
    // error if friendId doesn't exist
    if (checkResult.rowLength === 0) {
      throw new Error('Friend relationship not found');
    }

    // query to remove friend
    const query = 'DELETE FROM friends WHERE user_id = $1 AND friend_id = $2';
    // Execute the query using the PostgreSQL client
    await pgDb.query(query, [userId, friendId]);

    // Invalidate the cache for user's friends list after deletion
    const redisKey = `userFriends:${userId}`;
    await redis.del(redisKey);

    // Return true
    return true;
  } catch (err) {
    // console.error(err);
    throw new Error('Failed to remove friend');
  }
};

export {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
};
