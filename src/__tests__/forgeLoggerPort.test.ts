import {
  buildLoggerPortRange,
  findAvailablePortInRange,
} from '../../scripts/forge-logger-port';

describe('forge logger port probing', () => {
  it('builds a range from the base port', () => {
    expect(buildLoggerPortRange(19000)).toEqual({ start: 19000, end: 19999 });
  });

  it('returns the first available port in range', async () => {
    const isAvailable = jest.fn(async (port: number) => port === 19005);
    const port = await findAvailablePortInRange(
      { start: 19000, end: 19010 },
      isAvailable,
    );

    expect(port).toBe(19005);
    expect(isAvailable).toHaveBeenCalledTimes(6);
  });

  it('throws when no ports are available', async () => {
    const isAvailable = jest.fn(async () => false);

    await expect(
      findAvailablePortInRange({ start: 19000, end: 19002 }, isAvailable),
    ).rejects.toThrow('No available port in range 19000-19002');
  });
});
