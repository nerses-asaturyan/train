import { CronJob } from "cron";
import { runAllAdapters } from "./jobs/runAllAdapters";
import { runAggregateAllAdapters } from "./jobs/runAggregateAllAdapter";
import { runAdaptersFromTo } from "./jobs/runAdaptersFromTo";
import { handler as runWormhole } from "../handlers/runWormhole";

const createTimeout = (minutes: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${minutes} minutes`)), minutes * 60 * 1000)
  );

const withTimeout = async (promise: Promise<any>, timeoutMinutes: number) => {
  try {
    const result = await Promise.race([promise, createTimeout(timeoutMinutes)]);
    return result;
  } catch (error) {
    console.error("Job failed:", error);
  }
};

const cron = () => {
  withTimeout(runAllAdapters(), 10);
  withTimeout(runAggregateAllAdapters(), 20);
  withTimeout(runAdaptersFromTo(), 15);
  withTimeout(runWormhole(), 30);

  new CronJob("*/15 * * * *", async () => {
    await withTimeout(runAllAdapters(), 10);
  }).start();

  new CronJob("30 * * * *", async () => {
    await withTimeout(runAggregateAllAdapters(), 20);
  }).start();

  new CronJob("0 * * * *", async () => {
    await withTimeout(runAdaptersFromTo(), 15);
  }).start();

  new CronJob("0 * * * *", async () => {
    await withTimeout(runWormhole(), 30);
  }).start();
};

export default cron;
