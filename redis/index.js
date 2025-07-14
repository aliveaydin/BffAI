const { createClient } = require("redis");
const redisUri = process.env.REDIS_URI;
const loggedUserUri = process.env.REDIS_LOGGED_USER_URI;
const redisPassword = process.env.REDIS_PWD;
const redisUser = process.env.REDIS_USER;
const pubSubRedisUri = process.env.REDIS_PUBSUB_URI;

const client = createClient({
  url: redisUri,
  username: redisUser,
  password: redisPassword,
});

const loggedClient = createClient({
  url: loggedUserUri,
  username: redisUser,
  password: redisPassword,
});

const pubClient = createClient({
    url: pubSubRedisUri,
    password: redisPassword,
});

const subClient = pubClient.duplicate();

const connecToRedis = async () => {
  client.on("error", (err) => {
    console.log("Redis connection error:", err);
  });
 
  loggedClient.on("error", (err) => {
    console.log("Redis connection error:", err);
  });

  try {
    await client.connect();
    await loggedClient.connect();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    console.log("Successfully connected to Redis!");
  } catch (error) {
    console.log("Error connecting to Redis", error);
  }

  return { client, loggedClient, pubClient, subClient };
};

module.exports = { connecToRedis, client, loggedClient, pubClient, subClient };
