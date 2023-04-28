import { v4 as uuidv4 } from 'uuid';
import { cassandra } from '../../utils/db.mjs';
import { producer } from '../../kafka-server/kafkaClient.mjs';

// send a message to other user
const createMessageService = async (chatId, senderId, body) => {
  try {
    // Generate a new UUID for the message
    const messageId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert the new message into the Cassandra database
    const query = `
            INSERT INTO social_media.messages (id, chatId, senderId, body, created_at)
            VALUES (?, ?, ?, ?, ?) `;
    // parameters for the query
    const params = [messageId, chatId, senderId, body, createdAt];
    // Execute the query
    await cassandra.execute(query, params, { prepare: true });

    // update the chat data in Cassandra
    const updateQuery = 'UPDATE social_media.chats SET updatedAt = ? WHERE id = ?';
    // parameters for the query
    const updateParams = [createdAt, chatId];
    // Execute the update query
    await cassandra.execute(updateQuery, updateParams, { prepare: true });

    // Publish a message to Kafka topic 'message' after user sends a message
    await producer.send({
      topic: 'messages',
      messages: [
        {
          value: JSON.stringify({
          // convert to JSON string
            messageId,
            chatId,
            senderId,
            body,
            createdAt,
          }),
        },
      ],
    });

    // Return the new message to client
    return {
      messageId,
      chatId,
      senderId,
      body,
      createdAt,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to create message');
  }
};

// retrieve user messagges from chat
const getAllMessagesService = async (chatId) => {
  try {
    const query = 'SELECT * FROM social_media.messages WHERE chatId = ?';
    const result = await cassandra.execute(query, [chatId], { prepare: true });
    return result.rows;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get user messages');
  }
};



export {
  createMessageService,
  getAllMessagesService,
};
