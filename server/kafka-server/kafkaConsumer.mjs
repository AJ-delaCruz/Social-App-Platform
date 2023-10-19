/* eslint-disable max-len */
import { kafka } from './kafkaClient.mjs';
import { storeNotification } from './kafkaServices.mjs';
import { getAllFriendsService } from '../schema/services/friendServices.mjs';
import { getPostService } from '../schema/services/postServices.mjs';
import { updateChatService } from '../schema/services/chatServices.mjs';
import { addPostToNewsfeedService } from '../schema/services/newsFeedService.mjs';

import { redis } from '../utils/db.mjs';

// publishes events for Subscription resolver
import pubsub from '../utils/pubsub.mjs';

const kafkaConsumer = async (consumerId) => {
  // Connect the consumer to the Kafka broker

  // Create a new Kafka consumer for each function call
  const consumer = kafka.consumer({ groupId: 'social-media-group' }); // used to identify a group of consumers

  await consumer.connect()
    .then(() => console.log(`Connected to Kafka Consumer ${consumerId}`));

  // Subscribe to topics
  await consumer.subscribe({ topic: 'posts', fromBeginning: true });
  await consumer.subscribe({ topic: 'comments', fromBeginning: true });
  await consumer.subscribe({ topic: 'messages', fromBeginning: true });

  // Set up the consumer to process each message from topics
  // Perform kafka services after graphQL resolvers publish topics
  await consumer.run({
    // handles messages one at a time
    eachMessage: async ({ topic, partition, message }) => {
      // console.log(`Consumer ${consumerId} processing message from partition ${partition}`);

      const value = JSON.parse(message.value.toString()); // convert JSON string to JS object
      try {
        switch (topic) {
          case 'posts': {
            // console.log('Post created:', value);

            // Retrieve friend IDs
            const friendIds = await getAllFriendsService(value.userId, redis);

            // Add posts to newsfeed for all friends
            await Promise.all(friendIds.map((friendId) => addPostToNewsfeedService(friendId, value)));

            // Store notifications for all friends
            await Promise.all(friendIds.map((friendId) => storeNotification(friendId, value, 'POST_CREATED')));

            // Publish notifications for all friends
            await Promise.all(friendIds.map((friendId) => pubsub.publish(`NEW_NOTIFICATION_${friendId}`, { value })));

            break;
          }

          case 'comments': {
            console.log('Comment created:', value);
            // Retrieve the original post's user ID to be notified for comment
            const post = await getPostService(value.postId);
            const postUserId = post.user_id;
            // console.log(post);

            // Store notification  in cassandra
            await storeNotification(value.userId, value.message, 'COMMENT_CREATED');
            // publish notification to client
            pubsub.publish(`NEW_NOTIFICATION_${postUserId}`, { value });

            // TODO: Notify the post's user and users who have previously commented on the post
            break;
          }
          case 'messages': {
            console.log('Message sent:', value);
            pubsub.publish(`NEW_MESSAGE_${value.chatId}`, { value });
            const { chatId } = value;
            // update chat (updatedAt) in cassandra and redis after user message
            await updateChatService(chatId, redis);

            break;
          }
          default:
            break;
          // console.log('Unknown topic:', topic);
        }
      } catch (err) {
        console.error(`Error processing message from topic '${topic}':`, err);
      }
    },
  });

  // Disconnect consumers when the application shuts down
  process.once('SIGINT', async () => {
    await consumer.disconnect();
    console.log(`Consumer ${consumerId} disconnected.`);
    process.exit(0);
  });
};

export default kafkaConsumer;
