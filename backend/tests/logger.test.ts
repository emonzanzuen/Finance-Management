import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/lib/logger';
import { serializeRequest } from '../src/lib/logSerializers';

describe('logger redaction', () => {
  it('redacts password variants and deeply nested authorization headers', () => {
    let output = '';
    const destination = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = createLogger('development', destination);

    logger.info(
      {
        body: {
          currentPassword: 'current-secret',
          newPassword: 'new-secret',
          nested: { deeper: { password: 'nested-secret' } },
        },
        err: { config: { headers: { authorization: 'Bearer secret-token' } } },
      },
      'test redaction',
    );

    expect(output).toContain('[REDACTED]');
    for (const secret of ['current-secret', 'new-secret', 'nested-secret', 'Bearer secret-token']) {
      expect(output).not.toContain(secret);
    }
  });

  it('omits request bodies and query values from access log serialization', () => {
    const serialized = serializeRequest({
      id: 'request-id',
      method: 'POST',
      url: '/api/v1/auth/login?email=private@example.com&amount=123',
      remoteAddress: '127.0.0.1',
      body: { email: 'private@example.com', password: 'private-password', amount: 123 },
    } as Parameters<typeof serializeRequest>[0] & { body: unknown });
    expect(serialized).toEqual({ id: 'request-id', method: 'POST', url: '/api/v1/auth/login', remoteAddress: '127.0.0.1' });
    expect(JSON.stringify(serialized)).not.toContain('private@example.com');
    expect(JSON.stringify(serialized)).not.toContain('private-password');
    expect(JSON.stringify(serialized)).not.toContain('123');
  });
});
