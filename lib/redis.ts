import Redis from "ioredis";

export const redis = new Redis(
  "rediss://default:gQAAAAAAAvwfAAIgcDFkNmU1YzAwNmJhN2Q0NTQ2OTM2YzE3MTBhYzA4OTRkNQ@steady-koala-195615.upstash.io:6379",
);