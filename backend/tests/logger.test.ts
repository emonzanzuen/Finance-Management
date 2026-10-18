import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/lib/logger';

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
});
