import { networkInterfaces } from 'node:os';

const localDevelopmentOrigins = [
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
];

const isPrivateIPv4 = (address: string) => {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
};

export function localDevelopmentLanOrigins(addresses: string[] = Object.values(networkInterfaces())
  .flatMap((entries) => entries ?? [])
  .filter((entry) => entry.family === 'IPv4' && !entry.internal && isPrivateIPv4(entry.address))
  .map((entry) => entry.address)) {
  return [...new Set(addresses.filter(isPrivateIPv4))]
    .flatMap((address) => [4173, 5173].map((port) => `http://${address}:${port}`));
}

export function createAllowedOrigins(
  nodeEnv: string | undefined,
  clientOrigin: string | undefined,
  developmentLanOrigins = localDevelopmentLanOrigins(),
): Set<string> {
  if (nodeEnv === 'production') {
    if (!clientOrigin) {
      throw new Error('CLIENT_ORIGIN must be set to the public client origin in production.');
    }

    return new Set([clientOrigin]);
  }

  return new Set([
    ...localDevelopmentOrigins,
    ...developmentLanOrigins,
    ...(clientOrigin ? [clientOrigin] : []),
  ]);
}
