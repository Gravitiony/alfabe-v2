import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

const globalForQueue = globalThis as unknown as { mailQueue?: Queue };

export const mailQueue =
  globalForQueue.mailQueue ??
  new Queue("mail", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  });

if (process.env.NODE_ENV !== "production") globalForQueue.mailQueue = mailQueue;
