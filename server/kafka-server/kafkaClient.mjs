import { Kafka } from 'kafkajs';

const host = process.env.KAFKA_HOST_IP || 'localhost';

// Create the client with the broker list
const kafka = new Kafka({
  clientId: 'social-media-app', // app identifier to the Kafka brokers
  brokers: [`${host}:9092`],
});

// manage Kafka producer
const producer = kafka.producer();

export { producer, kafka };
