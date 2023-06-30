import { v4 as uuidv4 } from 'uuid';
import { cassandra } from '../../utils/db.mjs';

// retrieve friends list of the user
const getAllFriendsService = async (userId) => {
  try {
    // Query to retrieve friends from the Cassandra database
    const query = 'SELECT friend_id FROM social_media.friends WHERE user_id = ?';
    const params = [userId];
    // console.log(userId);
    // Execute the query using the Cassandra client
    const result = await cassandra.execute(query, params, { prepare: true });
    // console.log(result);

    // Extract friend IDs from the result
    // const friendIds = result.rows.map((row) => row.friendId);
    const friendIds = result.rows.map(
      (row) => row.friend_id.toString(), // convert UUID object to string
    );
    console.log(friendIds);
    return friendIds;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to retrieve friends IDs');
  }
};

// async getFriendRequests() {

//   // TODO: implement
// },

// request user to be added to friend's list
const sendFriendRequestService = async (userId, friendId) => {
  console.log(friendId);

  // TODO: implement a pending friend request logic

  try {
    // Generate ID using UUID v4
    const id = uuidv4();
    console.log(id);
    // Get the current timestamp for the post creation time
    const createdAt = new Date().toISOString();

    // // Check if user already exists in friend's list
    // const checkQuery = 'SELECT id FROM social_media.friends WHERE user_id = ? AND friend_id = ?';
    // const checkParams = [userId, friendId];
    // const checkResult = await cassandra.execute(checkQuery, checkParams, { prepare: true });
    // if (checkResult.rowLength > 0) {
    //   throw new Error("User already already exists in friend's list");
    // }

    // Check if user exists
    // const checkQuery = 'SELECT id FROM social_media.friends friendId = ?';
    // const checkParams = [friendId];
    // const checkResult = await cassandra.execute(checkQuery, checkParams, { prepare: true });
    // if (checkResult.rowLength === 0) {
    //   throw new Error('User is not found');
    // }

    // query to insert the friend into Cassandra
    const query = 'INSERT INTO social_media.friends (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)';
    // parameters for the query
    const params = [id, userId, friendId, createdAt];
    // Execute the query using the Cassandra client
    await cassandra.execute(query, params, { prepare: true }); // prepare statement and cache

    // Return the friend object
    return {
      id,
      userId,
      friendId,
      createdAt,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to add friend');
  }
};

const removeFriendService = async (userId, friendId) => {
  console.log(friendId);

  try {
    // Check if friendId exists in the user's friends list
    const checkQuery = 'SELECT id FROM social_media.friends WHERE user_id = ? AND friend_id = ?';
    const checkParams = [userId, friendId];
    const checkResult = await cassandra.execute(checkQuery, checkParams, { prepare: true });
    // error if friendId doesn't exist
    if (checkResult.rowLength === 0) {
      throw new Error('Friend relationship not found');
    }

    // query to remove friend
    const query = 'DELETE FROM social_media.friends WHERE user_id = ? AND friend_id = ?';
    // parameters for the query
    const params = [userId, friendId];
    // Execute the query using the Cassandra client
    await cassandra.execute(query, params, { prepare: true }); // prepare statement and cache

    // Return true
    return true;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to remove friend');
  }
};

export {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
};
