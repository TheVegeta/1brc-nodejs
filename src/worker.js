import readline from "node:readline";
import { Readable } from "node:stream";
import { parentPort } from "node:worker_threads";

parentPort.on("message", (chunk) => {
  const chunkStream = new Readable({
    read() {
      this.push(chunk);
      this.push(null);
    },
  });

  const lineReader = readline.createInterface({ input: chunkStream });

  const hashMap = {};

  lineReader.on("line", (input) => {
    const delimiterIndex = input.indexOf(";");
    const name = input.substring(0, delimiterIndex);
    const floatNumber = parseFloat(input.substring(delimiterIndex + 1));

    const existing = hashMap[name];

    if (existing) {
      const min = floatNumber < existing.min ? floatNumber : existing.min;
      const max = floatNumber > existing.max ? floatNumber : existing.max;
      const mean = (min + max) / 2;

      hashMap[name] = { min, mean, max };
    } else {
      hashMap[name] = {
        min: floatNumber,
        mean: floatNumber,
        max: floatNumber,
      };
    }
  });

  lineReader.on("close", () => {
    parentPort.postMessage(hashMap);
    process.exit();
  });
});
