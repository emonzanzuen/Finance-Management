import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from '../src/config/env';

const VALID_PROD_SECRET = 'k9X#mP2$vL8@nQ5!zR7&wT4^yU6*bN3%'; // 32 chars, random-looking

function catchEnvError(fn: () => unknown): EnvValidationError {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(EnvValidationError);
    return err as EnvValidationError;
  }
  throw new Error('Expected parseEnv to throw EnvValidationError');
}

describe('parseEnv configuration validation', () => {
  it('accepts minimal configuration in development and applies defaults', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://localhost:5432/finmanage_dev',
      JWT_SECRET: 'dev-only-short',
    });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('7d');
    expect(env.SCAN_ENABLED).toBe(false);
    expect(env.SCAN_DAILY_LIMIT).toBe(10);
    expect(env.CORS_ORIGINS).toEqual([]);
    expect(env.TRUST_PROXY).toBe(1);
  });

  it('rejects missing DATABASE_URL', () => {
    const err = catchEnvError(() =>
      parseEnv({
        NODE_ENV: 'development',
        JWT_SECRET: VALID_PROD_SECRET,
      }),
    );
    expect(err.message).toContain('DATABASE_URL');
  });

  it('rejects short JWT_SECRET in production without leaking secret value in error message', () => {
    const shortSecret = 'too-short-secret-value-12345';
    const err = catchEnvError(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/finmanage',
        DIRECT_URL: 'postgresql://localhost:5432/finmanage',
        JWT_SECRET: shortSecret,
      }),
    );

    expect(err.message).toContain('JWT_SECRET');
    expect(err.message).not.toContain(shortSecret);
  });

  it('rejects placeholder/sample JWT_SECRET in production even when >= 32 characters', () => {
    const placeholderSecret = 'please-change-me-in-production-0123456789abcdef';
    const err = catchEnvError(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/finmanage',
        DIRECT_URL: 'postgresql://localhost:5432/finmanage',
        JWT_SECRET: placeholderSecret,
      }),
    );

    expect(err.message).toContain('JWT_SECRET');
    expect(err.message).not.toContain(placeholderSecret);
  });

  it('rejects wildcard (*) in CORS_ORIGINS in production', () => {
    const err = catchEnvError(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/finmanage',
        DIRECT_URL: 'postgresql://localhost:5432/finmanage',
        JWT_SECRET: VALID_PROD_SECRET,
        CORS_ORIGINS: 'https://app.example.com, *',
      }),
    );

    expect(err.message).toContain('CORS_ORIGINS');
  });

  it('accepts valid production configuration', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      PORT: '4000',
      DATABASE_URL: 'postgresql://pooler.local:5432/finmanage',
      DIRECT_URL: 'postgresql://direct.local:5432/finmanage',
      JWT_SECRET: VALID_PROD_SECRET,
      CORS_ORIGINS: 'https://finmanage.example.com',
      SCAN_ENABLED: 'true',
      SCAN_DAILY_LIMIT: '15',
      TRUST_PROXY: '2',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(4000);
    expect(env.SCAN_ENABLED).toBe(true);
    expect(env.SCAN_DAILY_LIMIT).toBe(15);
    expect(env.CORS_ORIGINS).toEqual(['https://finmanage.example.com']);
    expect(env.TRUST_PROXY).toBe(2);
  });
});
