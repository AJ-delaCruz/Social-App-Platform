import { v4 as uuidv4 } from 'uuid';
import { cassandra } from '../../utils/db.mjs';

// create direct chat or group chat
const getOrCreateChatService = async (userId, recipientId) => {
  try {
    // Sort recipientIds
    recipientId.sort();
    const recipientIds = recipientId.join(',');

    // check if chat already exists
    const checkQuery = 'SELECT * FROM social_media.chats WHERE userId = ? AND recipientId = ?';
    const result = await cassandra.execute(checkQuery, [userId, recipientIds], { prepare: true });

    // return chat
    if (result && result.rowLength > 0) {
      return result.rows[0];
    }

    // if chat doesn't exist
    // Generate a new UUID for chat
    const chatId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert the new Chat into the Cassandra database
    const query = `
                INSERT INTO social_media.chats (id, userId, recipientId, created_at)
                VALUES (?, ?, ?,?) `;
    // parameters for the query
    const params = [chatId, userId, recipientIds, createdAt];
    // Execute the query
    await cassandra.execute(query, params, { prepare: true });

    // TODO: publish kafka topic message

    // Return the new chat
    return {
      id: chatId, userId, recipientId, createdAt,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to create chat');
  }
};

// retrieve all chat conversations with user
const getChatListService = async (userId) => {
  try {
    const query = 'SELECT * FROM social_media.chats WHERE userId = ?';
    const result = await cassandra.execute(query, [userId]);

    // return conversation list between user and other users
    return result.rows;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get chat list');
  }
};

export { getOrCreateChatService, getChatListService };
