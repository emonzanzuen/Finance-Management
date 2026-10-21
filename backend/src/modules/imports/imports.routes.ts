import { Router, type RequestHandler } from 'express';
import multer, { MulterError } from 'multer';
import { AppError } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { createUserRateLimit } from '../../middleware/rateLimit';
import {
  commitTransactionsImportController,
  getImportSpecController,
  getImportTemplateController,
  previewTransactionsImportController,
} from './imports.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 } });
const importRateLimit = createUserRateLimit(10, 60 * 60_000);

const uploadSingleFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('FILE_TOO_LARGE', 413, 'Ukuran file maksimal 2 MB.'));
      return;
    }
    if (error instanceof MulterError) {
      next(new AppError('VALIDATION_ERROR', 400, 'Permintaan upload tidak valid.'));
      return;
    }
    next(error);
  });
};

export const importsRouter = Router();
importsRouter.get('/imports/spec', requireAuth, getImportSpecController);
importsRouter.get('/imports/template', requireAuth, getImportTemplateController);
importsRouter.post('/imports/transactions/preview', requireAuth, importRateLimit, uploadSingleFile, previewTransactionsImportController);
importsRouter.post('/imports/transactions/commit', requireAuth, importRateLimit, commitTransactionsImportController);
