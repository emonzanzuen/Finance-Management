import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Values that look like documentation/sample placeholders. A production
 * JWT_SECRET containing any of these is rejected (case-insensitive).
 */
const PLACEHOLDER_SECRET_PATTERNS = [
  'changeme',
  'change-me',
  'change_me',
  'replace-me',
  'replace_me',
  'replaceme',
  'your-secret',
  'your_secret',
  'yoursecret',
  'your-jwt-secret',
  'your_jwt_secret',
  'example',
  'placeholder',
  'secret123',
  'supersecret',
];

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const booleanFromString = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (v === undefined) return undefined;
  if (typeof v === 'string') {
    const lower = v.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(lower)) return true;
    if (['false', '0', 'no'].includes(lower)) return false;
  }
  return v;
}, z.boolean().default(false));

const intFromString = (defaultValue: number, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(min).max(max).default(defaultValue),
  );

const envSchema = z
  .object({
    NODE_ENV: z.preprocess(
      emptyToUndefined,
      z.enum(['development', 'test', 'production']).default('development'),
    ),
    PORT: intFromString(3000, 1, 65535),
    DATABASE_URL: z.preprocess(emptyToUndefined, z.string({ error: 'wajib diisi' }).min(1)),
    DIRECT_URL: optionalString,
    JWT_SECRET: z.preprocess(emptyToUndefined, z.string({ error: 'wajib diisi' }).min(1)),
    JWT_EXPIRES_IN: z.preprocess(emptyToUndefined, z.string().min(1).default('7d')),
    GEMINI_API_KEY: optionalString,
    GEMINI_MODEL: optionalString,
    EMAIL_API_KEY: optionalString,
    EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().min(1).default('FinManage <onboarding@resend.dev>')),
    SCAN_ENABLED: booleanFromString,
    SCAN_DAILY_LIMIT: intFromString(10, 0, 1000),
    CORS_ORIGINS: z.preprocess(
      (value) => {
        const v = emptyToUndefined(value);
        if (v === undefined) return [];
        if (typeof v !== 'string') return v;
        return v
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0);
      },
      z.array(z.string().min(1)),
    ),
    TRUST_PROXY: intFromString(1, 0, 10),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    if (env.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'minimal 32 karakter di production',
      });
    }
    const lowerSecret = env.JWT_SECRET.toLowerCase();
    if (PLACEHOLDER_SECRET_PATTERNS.some((pattern) => lowerSecret.includes(pattern))) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'tidak boleh memakai nilai contoh di production',
      });
    }
    if (env.CORS_ORIGINS.some((origin) => origin.includes('*'))) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'tidak boleh berisi wildcard (*) di production',
      });
    }
    if (!env.DIRECT_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DIRECT_URL'],
        message: 'wajib diisi di production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Thrown when environment validation fails. The message never includes values. */
export class EnvValidationError extends Error {
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(issues: ReadonlyArray<{ path: string; message: string }>) {
    super(
      `Konfigurasi environment tidak valid: ${issues
        .map((issue) => `${issue.path} (${issue.message})`)
        .join('; ')}`,
    );
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

/**
 * Validates an environment-like record. Pure function (no side effects) so it
 * can be tested with arbitrary inputs.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Only field names and our own messages are reported; input values are never echoed.
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.') || '(root)',
      message: issue.code === 'custom' || issue.path.length === 0 ? issue.message : 'tidak valid',
    }));
    throw new EnvValidationError(issues);
  }
  return result.data;
}

let cachedEnv: Env | undefined;

/** Loads `.env` (if present) into process.env once, then validates it. */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;
  dotenv.config({ quiet: true });
  cachedEnv = parseEnv(process.env);
  return cachedEnv;
}
