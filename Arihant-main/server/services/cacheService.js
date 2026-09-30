const Redis = require('ioredis');

// Optimization: Graceful Redis fallback and retry strategy
const redisOptions = {
  retryStrategy(times) {
    // Stop retrying after 3 attempts
    if (times > 3) {
      console.warn("⚠️ Redis connection failed 3 times. Disabling Redis retries.");
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 1, // Don't hold up requests if Redis is struggling
  enableOfflineQueue: false, // Return error immediately if Redis is disconnected
};

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

let isRedisConnected = false;

redis.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Redis Connected');
});

redis.on('error', (err) => {
  if (isRedisConnected) {
    isRedisConnected = false;
  }
  // Suppress verbose reconnect errors after initial failure to prevent log spam
  if (err.code !== 'ECONNREFUSED') {
    console.error('❌ Redis Error:', err.message);
  }
});

/**
 * Generic helper that checks Redis first, then calls fetchFn(), stores result, returns it.
 * If Redis is unavailable, it gracefully falls back to fetchFn().
 */
const getCachedOrFetch = async (key, ttl, fetchFn) => {
  if (!isRedisConnected) {
    // Fallback directly to DB/fetchFn if Redis is down
    return await fetchFn();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await fetchFn();
    if (result) {
      // Don't await the set to avoid blocking the response
      redis.setex(key, ttl, JSON.stringify(result)).catch(err => console.error("Redis set error:", err.message));
    }
    return result;
  } catch (error) {
    console.warn(`⚠️ Redis Cache Error for key ${key}, falling back to DB:`, error.message);
    return await fetchFn();
  }
};

/**
 * Caches a school's catalogue (Standards + Products).
 */
const cacheSchoolCatalogue = async (schoolId, data) => {
  if (!isRedisConnected) return;
  const key = `school:${schoolId}:catalogue`;
  try {
    await redis.setex(key, 600, JSON.stringify(data)); // 10 min TTL
  } catch (error) {
    console.warn("⚠️ Failed to cache school catalogue:", error.message);
  }
};

/**
 * Invalidates school cache on mutations.
 */
const invalidateSchoolCache = async (schoolId) => {
  if (!isRedisConnected) return;
  const key = `school:${schoolId}:catalogue`;
  try {
    await redis.del(key);
  } catch (error) {
    console.warn("⚠️ Failed to invalidate school cache:", error.message);
  }
};

module.exports = {
  redis,
  getCachedOrFetch,
  cacheSchoolCatalogue,
  invalidateSchoolCache
};
