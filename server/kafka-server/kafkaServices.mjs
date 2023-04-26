import { v4 as uuidv4 } from 'uuid';
import { PubSub } from 'graphql-subscriptions';
import { cassandra } from '../utils/db.mjs';

const pubsub = new PubSub();

const sendNotification = async (message, type, recipientUserId) => {
  // Generate ID using UUID v4
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  // Insert the notification data into Cassandra
  try {
    await cassandra.execute(
      'INSERT INTO social_media.notifications (id, user_id, message, created_at, type) VALUES (?, ?, ?, ?, ?)',
      [id, recipientUserId, message, createdAt, type],
      { prepare: true },
    );
  } catch (err) {
    console.error(err);
    throw new Error('Failed to create notification');
  }

  // Publish the notification event to the recipient users when created
  pubsub.publish('NEW_NOTIFICATION', {
    newNotification: {
      id, userId: recipientUserId, message, createdAt, type,
    },
  });
};

export { sendNotification };
