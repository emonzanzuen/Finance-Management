import pino, { type DestinationStream, type Logger } from 'pino';

/** Paths redacted from every log line (docs/rules.md "Error dan log"). */
export const REDACT_PATHS = [
  'authorization',
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'otp',
  'x-api-key',
  '*.authorization',
  '*.password',
  '*.newPassword',
  '*.currentPassword',
  '*.*.password',
  '*.*.*.password',
  '*.*.*.*.password',
  '*.*.newPassword',
  '*.*.*.newPassword',
  '*.*.*.*.newPassword',
  '*.*.currentPassword',
  '*.*.*.currentPassword',
  '*.*.*.*.currentPassword',
  '*.token',
  '*.otp',
  '*["x-api-key"]',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.newPassword',
  'req.body.currentPassword',
  'req.body.token',
  'req.body.otp',
  'err.config.headers.authorization',
  'err.config.headers.Authorization',
  'config.headers.authorization',
  'config.headers.Authorization',
];

export function createLogger(nodeEnv: string, destination?: DestinationStream): Logger {
  return pino({
    level: nodeEnv === 'test' ? 'silent' : nodeEnv === 'production' ? 'info' : 'debug',
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  }, destination);
}
