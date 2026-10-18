import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/** Assigns a fresh UUID per request and exposes it via the `X-Request-Id` header. */
export const requestId: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  req.id = id;
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
