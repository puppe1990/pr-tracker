import { createServer } from "net";

/**
 * Find the next available TCP port starting from `startPort`.
 * Increments by 1 until a free port is found or `maxAttempts` is reached.
 *
 * @example
 * const port = await findAvailablePort(3000);
 * // 3000 if free, otherwise 3001, 3002, etc.
 */
export function findAvailablePort(
  startPort: number,
  maxAttempts = 100
): Promise<number> {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function tryPort() {
      if (attempts >= maxAttempts) {
        reject(
          new Error(
            `Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`
          )
        );
        return;
      }

      attempts += 1;
      const server = createServer();

      server.once("error", (err: NodeJS.ErrnoException) => {
        server.close();

        if (err.code === "EADDRINUSE") {
          currentPort += 1;
          tryPort();
        } else {
          reject(err);
        }
      });

      server.once("listening", () => {
        const address = server.address();
        const port =
          typeof address === "object" && address !== null ? address.port : null;
        server.close(() => {
          if (port !== null) {
            resolve(port);
          } else {
            reject(new Error("Could not determine port from server address"));
          }
        });
      });

      server.listen(currentPort, "0.0.0.0");
    }

    tryPort();
  });
}
