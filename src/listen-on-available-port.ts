import type { Application } from 'express';
import type { Server } from 'net';

/**
 * Start listening on the first available TCP port starting from `startPort`.
 * Retries on EADDRINUSE without a pre-check, eliminating race conditions.
 *
 * @example
 * const { server, port } = await listenOnAvailablePort(app, 3000);
 */
export function listenOnAvailablePort(
  app: Application,
  startPort: number,
  maxAttempts = 100
): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let attempts = 0;

    function tryListen() {
      if (attempts >= maxAttempts) {
        reject(
          new Error(
            `Could not bind to an available port after ${maxAttempts} attempts starting from ${startPort}`
          )
        );
        return;
      }

      attempts += 1;
      const server = app.listen(port, '0.0.0.0', () => {
        resolve({ server, port });
      });

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          port += 1;
          tryListen();
        } else {
          reject(err);
        }
      });
    }

    tryListen();
  });
}
