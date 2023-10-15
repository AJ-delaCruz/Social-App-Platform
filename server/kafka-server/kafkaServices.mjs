import { redis, cassandra } from '../utils/db.mjs';
import { getAllFriendsService } from '../schema/services/friendServices.mjs';
import pubsub from '../utils/pubsub.mjs';

const storeNotification = async (recipientUserId, post, type) => {
  const postId = post.id;
  const createdAt = new Date().toISOString();

  // Insert the notification data into Cassandra
  try {
    await cassandra.execute(
      'INSERT INTO social_media.notifications (user_id, post_id, message, created_at, type) VALUES (?, ?, ?, ?, ?) USING TTL ?',
      [recipientUserId, postId, post.message, createdAt, type, 86400], // TTL set to 1 day
      { prepare: true },
    );
  } catch (err) {
    console.error(err);
    throw new Error('Failed to create notification');
  }
};

const storeNotificationForAllUsers = async (userId, post, type) => {
  // retrieve friend IDs
  const friendIds = await getAllFriendsService(userId, redis);

  // concurrently store notifications
  await Promise.all(
    friendIds.map(async (friendId) => {
      await storeNotification(friendId, post, type);
    }),
  );
};

const publishNotificationsForAllUsers = async (recipientUserId, value) => {
  const friendIds = await getAllFriendsService(recipientUserId, redis);
  await Promise.all(
    friendIds.map((friendId) => pubsub.publish(`NEW_NOTIFICATION_${friendId}`, { value })),
  );
};

const fetchNotifications = async (userId, limit = 10) => {
  try {
    const query = 'SELECT * FROM notifications WHERE user_id = ? LIMIT ?';
    const params = [userId, limit];

    const result = await cassandra.execute(query, params, { prepare: true });
    return result.rows;
  } catch (error) {
    // console.error('Error fetching from notifications:', error);
    throw new Error('Failed to retrieve notifications');
  }
};

export {
  storeNotification,
  storeNotificationForAllUsers,
  publishNotificationsForAllUsers,
  fetchNotifications,
};
