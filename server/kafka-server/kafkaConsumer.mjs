import { consumer } from './kafkaClient.mjs';
import { sendNotification } from './kafkaServices.mjs';
import { getAllFriendsService } from '../schema/services/friendServices.mjs';
import { getPostService } from '../schema/services/postServices.mjs';

const kafkaConsumer = async () => {
  // Connect the consumer to the Kafka broker
  await consumer.connect();

  // Subscribe to topics
  await consumer.subscribe({ topic: 'posts', fromBeginning: true });
  await consumer.subscribe({ topic: 'comments', fromBeginning: true });

  // Set up the consumer to process each message from topics
  // Perform kafka services after graphQL resolvers publish topics
  await consumer.run({
    // handles messages one at a time
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString()); // convert JSON string to JS object

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
            postUserId,
          );
          // TODO: Notify the post's user and users who have previously commented on the post
          break;
        }
        default:
          console.log('Unknown topic:', topic);
      }
    },
  });
};

export default kafkaConsumer;
