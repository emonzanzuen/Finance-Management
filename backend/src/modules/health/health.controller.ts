import type { Request, Response } from 'express';

/**
 * GET /api/v1/health — public, no database query.
 * Returns only non-sensitive liveness info.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    data: {
      status: 'ok',
      time: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
  });
}
