import { loadEnv } from './env';

describe('loadEnv', () => {
  it('allows a development fallback secret', () => {
    const result = loadEnv({ NODE_ENV: 'development' });
    expect(result.jwtSecret).toBe('dev-secret-change-me');
    expect(result.enableSwagger).toBe(true);
    expect(result.isProduction).toBe(false);
  });

  it('rejects a weak production secret', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'change-me-in-production',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects a short production secret', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'short-secret' }),
    ).toThrow(/JWT_SECRET/);
  });

  it('accepts a strong production secret and hides swagger by default', () => {
    const result = loadEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-long-production-secret-key!!',
    });
    expect(result.isProduction).toBe(true);
    expect(result.enableSwagger).toBe(false);
    expect(result.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('can re-enable swagger in production', () => {
    const result = loadEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-long-production-secret-key!!',
      ENABLE_SWAGGER: 'true',
    });
    expect(result.enableSwagger).toBe(true);
  });
});
