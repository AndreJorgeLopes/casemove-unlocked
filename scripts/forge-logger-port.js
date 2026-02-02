'use strict';

const net = require('net');

const DEFAULT_RANGE_SIZE = 1000;

const buildLoggerPortRange = (basePort, rangeSize = DEFAULT_RANGE_SIZE) => {
  const start = Number(basePort);
  if (!Number.isFinite(start) || start <= 0) {
    throw new Error(`Invalid base port: ${basePort}`);
  }

  const size = Number(rangeSize);
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`Invalid range size: ${rangeSize}`);
  }

  return { start, end: start + size - 1 };
};

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });

const findAvailablePortInRange = async (range, isAvailable) => {
  if (!range || !Number.isFinite(range.start) || !Number.isFinite(range.end)) {
    throw new Error('Invalid port range');
  }
  if (range.start > range.end) {
    throw new Error('Invalid port range');
  }

  for (let port = range.start; port <= range.end; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port in range ${range.start}-${range.end}`);
};

const resolveLoggerPort = async (start, end) =>
  findAvailablePortInRange({ start, end }, isPortAvailable);

if (require.main === module) {
  const [startArg, endArg] = process.argv.slice(2);
  const start = Number(startArg);
  const end = Number(endArg);

  resolveLoggerPort(start, end)
    .then((port) => {
      process.stdout.write(String(port));
    })
    .catch((error) => {
      process.stderr.write(error.message);
      process.exit(1);
    });
}

module.exports = {
  buildLoggerPortRange,
  findAvailablePortInRange,
  resolveLoggerPort,
  isPortAvailable,
};
