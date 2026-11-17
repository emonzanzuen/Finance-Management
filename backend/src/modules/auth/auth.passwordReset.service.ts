import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { Logger } from 'pino';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { loadEnv } from '../../config/env';
import { createLogger } from '../../lib/logger';
import { hashPassword, validatePassword } from './auth.service';
import type { ForgotPasswordInput, ResetPasswordInput } from './auth.passwordReset.schema';

export interface EmailSender {
  sendPasswordResetCode(email: string, code: string): Promise<void>;
}

export class ResendDeliveryError extends Error {
  constructor(
    readonly reason: 'missing_api_key' | 'provider_rejected',
    readonly providerStatus?: number,
    readonly providerCode?: string,
    readonly providerHint?: 'testing_sender_restriction' | 'sender_domain_not_verified' | 'api_key_domain_restriction' | 'recipient_policy' | 'other',
  ) {
    super('Password reset email was not accepted by Resend.');
    this.name = 'ResendDeliveryError';
  }
}

function safeProviderCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const code = value.slice(0, 80);
  return /^[a-zA-Z0-9_.-]+$/.test(code) ? code : undefined;
}

function classifyProviderMessage(value: unknown): NonNullable<ResendDeliveryError['providerHint']> | undefined {
  if (typeof value !== 'string') return undefined;
  const message = value.toLowerCase();
  if (message.includes('resend.dev') || message.includes('testing domain') || message.includes('testing emails')) return 'testing_sender_restriction';
  if ((message.includes('domain') && (message.includes('not verified') || message.includes('unverified'))) || message.includes('verify your domain')) return 'sender_domain_not_verified';
  if (message.includes('api key') && (message.includes('domain') || message.includes('restrict'))) return 'api_key_domain_restriction';
  if (message.includes('recipient') && (message.includes('not allowed') || message.includes('verified'))) return 'recipient_policy';
  return 'other';
}

export async function sendResendEmail(
  email: string,
  code: string,
  config: Pick<ReturnType<typeof loadEnv>, 'EMAIL_API_KEY' | 'EMAIL_FROM'> = loadEnv(),
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const { EMAIL_API_KEY, EMAIL_FROM } = config;
  if (!EMAIL_API_KEY) throw new ResendDeliveryError('missing_api_key');
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${EMAIL_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: 'Kode reset password FinManage',
      text: `Kode reset password Anda: ${code}. Kode berlaku selama 10 menit. Jika Anda tidak meminta reset password, abaikan email ini.`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    let providerCode: string | undefined;
    let providerHint: NonNullable<ResendDeliveryError['providerHint']> | undefined;
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null) {
        if ('name' in body) providerCode = safeProviderCode(body.name);
        if ('message' in body) providerHint = classifyProviderMessage(body.message);
      }
    } catch {
      // Keep the provider response body out of logs; it may echo submitted data.
    }
    throw new ResendDeliveryError('provider_rejected', response.status, providerCode, providerHint);
  }
}

export const resendEmailSender: EmailSender = {
  sendPasswordResetCode: (email, code) => sendResendEmail(email, code),
};

const invalidOtp = () => new AppError('OTP_INVALID_OR_EXPIRED', 400, 'Kode OTP tidak valid atau sudah kedaluwarsa.');

function hashCode(code: string): string {
  return createHmac('sha256', loadEnv().JWT_SECRET).update(code).digest('hex');
}

function matchesCode(storedHash: string, code: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const expected = Buffer.from(storedHash, 'hex');
  const received = Buffer.from(hashCode(code), 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function forgotPassword(
  input: ForgotPasswordInput,
  sender: EmailSender = resendEmailSender,
  logger: Pick<Logger, 'info' | 'warn'> = createLogger(loadEnv().NODE_ENV),
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, email: true } });
  if (!user) return;
  const code = String(randomInt(100_000, 1_000_000));
  const now = new Date();
  const resetId = await prisma.$transaction(async (tx) => {
    await tx.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } });
    const reset = await tx.passwordReset.create({
      data: { userId: user.id, codeHash: hashCode(code), expiresAt: new Date(now.getTime() + 10 * 60_000), attempts: 0 },
      select: { id: true },
    });
    return reset.id;
  });
  logger.info({ event: 'auth.password_reset.otp_created' }, 'Password reset OTP record created.');
  try {
    await sender.sendPasswordResetCode(user.email, code);
    logger.info({ event: 'auth.password_reset.email_accepted', provider: 'resend' }, 'Password reset email accepted by provider.');
  } catch (error) {
    try {
      await prisma.passwordReset.updateMany({ where: { id: resetId, usedAt: null }, data: { usedAt: new Date() } });
    } catch {
      logger.warn({ event: 'auth.password_reset.otp_invalidation_failed' }, 'Could not invalidate OTP after email delivery failure.');
    }
    logger.warn({
      event: 'auth.password_reset.email_failed',
      provider: 'resend',
      reason: error instanceof ResendDeliveryError ? error.reason : 'request_failed',
      ...(error instanceof ResendDeliveryError && error.providerStatus ? { providerStatus: error.providerStatus } : {}),
      ...(error instanceof ResendDeliveryError && error.providerCode ? { providerCode: error.providerCode } : {}),
      ...(error instanceof ResendDeliveryError && error.providerHint ? { providerHint: error.providerHint } : {}),
      ...(error instanceof Error && !(error instanceof ResendDeliveryError) ? { errorName: error.name } : {}),
    }, 'Password reset email was not accepted by provider.');
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, email: true } });
  const now = new Date();
  const reset = user ? await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: now }, attempts: { lt: 5 } },
    orderBy: { createdAt: 'desc' },
  }) : null;
  if (!user || !reset || !matchesCode(reset.codeHash, input.code)) {
    if (reset) {
      await prisma.passwordReset.updateMany({
        where: { id: reset.id, usedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
    }
    throw invalidOtp();
  }
  validatePassword(input.newPassword, user.email);
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordReset.updateMany({
      where: { id: reset.id, userId: user.id, codeHash: reset.codeHash, usedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw invalidOtp();
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.deviceToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  });
}
