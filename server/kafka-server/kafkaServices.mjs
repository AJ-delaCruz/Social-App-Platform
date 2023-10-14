import { v4 as uuidv4 } from 'uuid';
import { cassandra } from '../utils/db.mjs';

const storeNotification = async (recipientUserId, message, type) => {
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
};

export default storeNotification;
