import path from "node:path";
import { run } from "node:test";
import { spec } from "node:test/reporters";

const files = [
  "src/app/[locale]/screen-recorder/compose-queue.test.mts",
  "src/app/[locale]/screen-recorder/ffmpeg-platform.test.mts",
  "src/app/[locale]/screen-recorder/project-health.test.mts",
  "src/app/[locale]/screen-recorder/recording-lock.test.mts",
].map((file) => path.join(process.cwd(), file));

run({ files })
  .on("test:fail", () => {
    process.exitCode = 1;
  })
  .compose(spec())
  .pipe(process.stdout);
