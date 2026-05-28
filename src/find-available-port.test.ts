import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'net';
import { findAvailablePort } from './find-available-port';

describe('findAvailablePort', () => {
  it('should return the start port when it is free', async () => {
    const port = await findAvailablePort(33100);
    expect(port).toBe(33100);
  });

  it('should find the next available port when the start port is in use', async () => {
    const blocker = createServer();
    const occupiedPort = 33200;

    await new Promise<void>((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(occupiedPort, '0.0.0.0', () => resolve());
    });

    try {
      const port = await findAvailablePort(occupiedPort);
      expect(port).toBe(occupiedPort + 1);
    } finally {
      blocker.close();
    }
  });

  it('should reject after max attempts', async () => {
    const startPort = 34000;
    const servers: ReturnType<typeof createServer>[] = [];

    // Occupy ports 34000–34004
    for (let i = 0; i < 5; i += 1) {
      const server = createServer();
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(startPort + i, '0.0.0.0', () => resolve());
      });
      servers.push(server);
    }

    try {
      await expect(findAvailablePort(startPort, 3)).rejects.toThrow(
        'Could not find an available port'
      );
    } finally {
      for (const server of servers) {
        server.close();
      }
    }
  });
});
