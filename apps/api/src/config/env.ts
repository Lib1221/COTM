const WEAK_SECRETS = new Set([
  '',
  'change-me-in-production',
  'dev-secret-change-me',
  'secret',
  'jwt-secret',
]);

export type AppEnv = {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string | undefined;
  enableSwagger: boolean;
};

function requireProductionSecret(secret: string | undefined): string {
  if (!secret || WEAK_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a strong value of at least 32 characters in production.',
    );
  }
  return secret;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const nodeEnv = source.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = isProduction
    ? requireProductionSecret(source.JWT_SECRET)
    : (source.JWT_SECRET ?? 'dev-secret-change-me');

  const enableSwagger =
    source.ENABLE_SWAGGER === 'true' ||
    (source.ENABLE_SWAGGER !== 'false' && !isProduction);

  const port = Number.parseInt(source.PORT ?? '4000', 10);

  return {
    nodeEnv,
    isProduction,
    port: Number.isFinite(port) ? port : 4000,
    jwtSecret,
    jwtExpiresIn: source.JWT_EXPIRES_IN ?? '7d',
    corsOrigin: source.CORS_ORIGIN,
    enableSwagger,
  };
}

export const env = loadEnv();
