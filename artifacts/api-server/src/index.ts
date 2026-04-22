import app from "./app.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number.parseInt(rawPort);

if (!Number.isInteger(port)) {
  throw new Error(
    `PORT environment variable must be an integer, got: ${rawPort}`,
  );
}

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
