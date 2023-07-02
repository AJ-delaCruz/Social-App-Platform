import { promisify } from 'util';

const promisifyRedisClient = (redisClient) => {
  // avoid error-first callback pattern and use promise
  const redisGetAsync = promisify(redisClient.get).bind(redisClient);
  const redisSetAsync = promisify(redisClient.set).bind(redisClient);
  return { redisGetAsync, redisSetAsync };
};

export default promisifyRedisClient;
