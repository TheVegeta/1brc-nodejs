import fs from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";

console.time("execution time");

const filePath = path.resolve(process.cwd(), "measurements.txt");
const workerPath = path.resolve(process.cwd(), "src/worker.js");

const readStream = fs.createReadStream(filePath, {
  highWaterMark: 100 * 1024 * 1024,
});

const hashMapArray = [];
const workerPromises = [];

readStream.on("data", (chunk) => {
  const worker = new Worker(workerPath);

  const workerPromise = new Promise((resolve, reject) => {
    worker.postMessage(chunk);

    worker.on("message", (data) => {
      hashMapArray.push(data);
      worker.terminate().then(resolve).catch(reject);
    });
  });

  workerPromises.push(workerPromise);
});

readStream.on("end", () => {
  Promise.all(workerPromises)
    .then(() => {
      const hashMap = {};

      for (let i = 0; i < hashMapArray.length; i++) {
        const xMain = hashMapArray[i];
        for (const key in xMain) {
          if (xMain.hasOwnProperty(key)) {
            if (hashMap[key]) {
              const existing = hashMap[key];
              const current = xMain[key];

              const min = Math.min(existing.min, current.min);
              const max = Math.max(existing.max, current.max);
              const mean = (min + max) / 2;

              hashMap[key] = { min, mean, max };
            } else {
              hashMap[key] = xMain[key];
            }
          }
        }
      }
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      console.timeEnd("execution time");
    });
});
