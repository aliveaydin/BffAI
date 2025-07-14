const { Kafka } = require("kafkajs");
const clientId = process.env.KAFKA_CLIENT_ID;

const kafkaUser = process.env.KAFKA_USER;
const kafkaPassword = process.env.KAFKA_PASSWORD;
const kafkaMechanism = process.env.KAFKA_MECHANISM;

let kafkaS = {};
if (kafkaUser) {
  kafkaS = {
    sasl: {
      mechanism: kafkaMechanism,
      username: kafkaUser,
      password: kafkaPassword,
    },
  };
}
const kafka = new Kafka({
  sasl: kafkaS.sasl,
  ssl: false,
  clientId,
  brokers: [process.env.KAFKA_IP],
});

const consumer = kafka.consumer({ groupId: "bff-ai" });
const producer = kafka.producer();

const kafKaStarter = async () => {
  try {
    await consumer.connect();
    await producer.connect();
    return console.log("Kafka Connected");
  } catch (error) {
    return error;
  }
};
const sendMessage = async (topic, payload) => {
  if (!topic) throw new Error("Topic name is required");
  if (payload === undefined || payload === null)
    throw new Error("Payload cannot be null/undefined");

  const value = typeof payload === "string" ? payload : JSON.stringify(payload);

  try {
    await producer.send({
      topic,
      messages: [{ value }],
    });
  } catch (err) {
    console.error("Kafka publish error:", err);
    throw err; // bubble up so callers can handle it
  }
};

module.exports = { kafKaStarter, consumer, producer, sendMessage };
