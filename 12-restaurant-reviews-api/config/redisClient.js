const { Redis } = require('@upstash/redis');
require('dotenv').config();

// 1. Create the engine using the Upstash REST API
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 2. The Pulse Check Function
const testRedisConnection = async () => {
  try {
    // Try to save a tiny piece of test data
    await redisClient.set('engine_test', 'online');
    console.log('⚡ Connected to the Upstash Redis Engine (REST API)');
  } catch (error) {
    console.error('❌ Redis Engine Failed to Start:', error.message);
  }
};

// 3. Run the pulse check
testRedisConnection();

module.exports = redisClient;