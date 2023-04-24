import { consumer } from './kafkaClient.mjs';
import { postNotification, commentNotification } from './kafkaServices.mjs';

const kafkaConsumer = async () => {
  // Connect the consumer to the Kafka broker
  await consumer.connect();

  // Subscribe to topics
  await consumer.subscribe({ topic: 'posts', fromBeginning: true });
  await consumer.subscribe({ topic: 'comments', fromBeginning: true });

  // Set up the consumer to process each message from topics
  // Perform kafka services after graphQL API publishes topic
  await consumer.run({
    // handles messages one at a time
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString()); // convert JSON string to JS object

      switch (topic) {
        case 'posts':
          console.log('Post created:', value);
          // send notication to user's friends after post is created
          await postNotification(value);
          break;
        case 'comments':
          console.log('Comment created:', value);
          // send notication to the post's user after replying to the post
          await commentNotification(value);
          break;
        default:
          console.log('Unknown topic:', topic);
      }
    },
  });
};

export default kafkaConsumer;
