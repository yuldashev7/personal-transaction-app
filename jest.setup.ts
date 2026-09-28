jest.mock('expo-crypto', () => {
  const { createHash, randomBytes } =
    jest.requireActual<typeof import('node:crypto')>('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: () => crypto.randomUUID(),
    getRandomBytes: (count: number) => new Uint8Array(randomBytes(count)),
    digestStringAsync: async (_algorithm: string, data: string) =>
      createHash('sha256').update(data).digest('hex'),
  };
});

jest.mock('@/shared/lib/logger');
