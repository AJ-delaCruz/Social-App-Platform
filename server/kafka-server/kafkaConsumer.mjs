import { kafka } from './kafkaClient.mjs';
import sendNotification from './kafkaServices.mjs';
import { getAllFriendsService } from '../schema/services/friendServices.mjs';
import { getPostService } from '../schema/services/postServices.mjs';
// publishes events for Subscription resolver
import pubsub from '../utils/pubsub.mjs';

const kafkaConsumer = async (consumerId) => {
  // Connect the consumer to the Kafka broker

  // Create a new Kafka consumer for each function call
  const consumer = kafka.consumer({ groupId: 'social-media-group' }); // used to identify a group of consumers

  await consumer.connect();
  // .then(() => console.log(`Connected to Kafka Consumer ${consumerId}`));

  // Subscribe to topics
  await consumer.subscribe({ topic: 'posts', fromBeginning: true });
  await consumer.subscribe({ topic: 'comments', fromBeginning: true });
  await consumer.subscribe({ topic: 'messages', fromBeginning: true });

  // Set up the consumer to process each message from topics
  // Perform kafka services after graphQL resolvers publish topics
  await consumer.run({
    // handles messages one at a time
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Consumer ${consumerId} processing message from partition ${partition}`);

      const value = JSON.parse(message.value.toString()); // convert JSON string to JS object
      try {
        switch (topic) {
          case 'posts': {
            console.log('Post created:', value);

            // retrieve the user's friends IDs to be notified for post
            const friends = await getAllFriendsService(value.userId);

            // Send notification to each friend about the new post
            await Promise.all(
              // execute multiple asynchronous sendNotification() calls concurrently
              friends.map((friendId) => sendNotification(`New post from ${value.userId}`, 'POST_CREATED', friendId)),
            );
            break;
          }
          case 'comments': {
            console.log('Comment created:', value);
            // Retrieve the original post's user ID to be notified for comment
            const post = await getPostService(value.postId);
            const postUserId = post.userId;

            // Send comment notification to the user who created the post
            await sendNotification(
              `New comment from ${value.userId} on post ${value.postId}`,
              'COMMENT_CREATED',
              postUserId, // recepient for comment
            );
            // TODO: Notify the post's user and users who have previously commented on the post
            break;
          }
          case 'messages': {
            // console.log('Message sent:', value);
            pubsub.publish('NEW_MESSAGE', { value });

            break;
          }
          default:
            console.log('Unknown topic:', topic);
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
