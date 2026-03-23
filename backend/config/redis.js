const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log("❌ Redis reconnect failed");
        return new Error("Retry limit reached");
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("🔄 Redis Connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis Ready");
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err.message);
  }
};

module.exports = { redisClient, connectRedis };