import { v4 as uuidv4 } from 'uuid';
import { cassandra } from '../../utils/db.mjs';
import promisifyRedisClient from '../../utils/promisifyRedis.mjs';

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
const getChatListService = async (userId, redis) => {
  const { redisGetAsync, redisSetAsync } = promisifyRedisClient(redis);

  try {
    const redisKey = `chat:${userId}`;
    // Check if chats in the Redis cache
    const cachedChat = await redisGetAsync(redisKey);
    // return data
    if (cachedChat) {
      console.log('Found user in Redis cache');
      return JSON.parse(cachedChat);
    }

    // retrieve from db if not saved in cache
    const query = 'SELECT * FROM social_media.chats WHERE userId = ?';
    const result = await cassandra.execute(query, [userId]);

    // Store the chat data in the cache for future requests
    await redisSetAsync(redisKey, JSON.stringify(result), 'EX', 3600);

    // return conversation list between user and other users
    return result.rows;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get chat list');
  }
};

// retrieve chat
const getChatService = async (chatId, redis) => {
  const { redisGetAsync, redisSetAsync } = promisifyRedisClient(redis);

  try {
    const redisKey = `chat:${chatId}`;
    // Check if chat is in the Redis cache
    const cachedChat = await redisGetAsync(redisKey);
    if (cachedChat === null) {
      // If the chat is not in the cache, fetch it from the database
      const chat = await cassandra.execute('SELECT * FROM chats WHERE id = ?', [chatId]);

      if (!chat || chat.rowLength === 0) {
        throw new Error(`Chat id: ${chatId} not found`);
      }
      // Store the chat data in the cache for future requests
      await redisSetAsync(redisKey, JSON.stringify(chat), 'EX', 3600);
    }
    // return chat from redis
    return JSON.parse(cachedChat);
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get chat');
  }
};

const updateChatService = async (chatId, redis) => {
  const { redisGetAsync, redisSetAsync } = promisifyRedisClient(redis);
  const updatedAt = new Date().toISOString();

  try {
    // update the chat date in Cassandra
    const updateQuery = 'UPDATE social_media.chats SET updatedAt = ? WHERE id = ?';
    // parameters for the query
    const updateParams = [updatedAt, chatId];
    // Execute the update query
    await cassandra.execute(updateQuery, updateParams, { prepare: true });

    // update chat Redis cache
    const redisKey = `chat:${chatId}`;
    const cachedChat = await redisGetAsync(redisKey);
    // chat will always be in the cache due to getChat
    const chat = JSON.parse(cachedChat);
    chat.updatedAt = updatedAt;
    await redisSetAsync(redisKey, JSON.stringify(chat), 'EX', 3600);

    return chat;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to update chat');
  }
};

export {
  getOrCreateChatService, getChatListService, getChatService, updateChatService,
};
