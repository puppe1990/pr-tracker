import { describe, it, expect } from 'vitest';
import express from 'express';
import { createServer } from 'net';
import { listenOnAvailablePort } from './listen-on-available-port';

describe('listenOnAvailablePort', () => {
  it('should listen on the start port when it is free', async () => {
    const app = express();
    const { server, port } = await listenOnAvailablePort(app, 33300);

    expect(port).toBe(33300);
    expect(server.listening).toBe(true);

    server.close();
  });

  it('should find the next available port when the start port is in use', async () => {
    const blocker = createServer();
    const occupiedPort = 33400;

    await new Promise<void>((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(occupiedPort, '0.0.0.0', () => resolve());
    });

    try {
      const app = express();
      const { server, port } = await listenOnAvailablePort(app, occupiedPort);

      expect(port).toBe(occupiedPort + 1);
      expect(server.listening).toBe(true);

      server.close();
    } finally {
      blocker.close();
    }
  });

  it('should reject after max attempts', async () => {
    const startPort = 34100;
    const servers: ReturnType<typeof createServer>[] = [];

    for (let i = 0; i < 5; i += 1) {
      const server = createServer();
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(startPort + i, '0.0.0.0', () => resolve());
      });
      servers.push(server);
    }

    try {
      const app = express();
      await expect(listenOnAvailablePort(app, startPort, 3)).rejects.toThrow(
        'Could not bind to an available port'
      );
    } finally {
      for (const server of servers) {
        server.close();
      }
    }
  });
});
