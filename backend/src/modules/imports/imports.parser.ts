import ExcelJS from 'exceljs';
import { AppError } from '../../lib/errors';
import { isValidDateOnly, wibToday } from '../../lib/dates';
import { MAX_AMOUNT } from '../../lib/money';
import { prisma } from '../../lib/prisma';

const ALLOWED = ['Tanggal', 'Bulan', 'Tahun', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'] as const;
const REQUIRED = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'] as const;
const IGNORED = ['No', 'Hari'] as const;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 100;
const MAX_ROWS = 1000;
const MAX_COLUMNS = 10;
const MONTHS = new Map<string, number>([
  ['januari', 1], ['january', 1], ['februari', 2], ['february', 2], ['maret', 3], ['march', 3],
  ['april', 4], ['mei', 5], ['may', 5], ['juni', 6], ['june', 6], ['juli', 7], ['july', 7],
  ['agustus', 8], ['august', 8], ['september', 9], ['oktober', 10], ['october', 10],
  ['november', 11], ['desember', 12], ['december', 12],
]);

export interface ImportPreview {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  unknownCategories: string[];
  rows: Array<Record<string, unknown>>;
}

function invalidFile(): AppError {
  return new AppError('IMPORT_INVALID_FILE', 400, 'File Excel tidak valid.');
}

function inspectZip(buffer: Buffer): void {
  if (buffer.length > MAX_FILE_BYTES) throw new AppError('FILE_TOO_LARGE', 413, 'Ukuran file maksimal 2 MB.');
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new AppError('UNSUPPORTED_FILE', 415, 'File harus berupa Excel .xlsx.');
  }
  const min = Math.max(0, buffer.length - 65_557);
  let endOffset = -1;
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { endOffset = offset; break; }
  }
  if (endOffset < 0) throw invalidFile();
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (entryCount > MAX_ZIP_ENTRIES) throw new AppError('IMPORT_LIMIT_EXCEEDED', 400, 'File Excel memiliki terlalu banyak komponen.');
  if (directoryOffset + directorySize > endOffset || directoryOffset > buffer.length) throw invalidFile();
  let offset = directoryOffset;
  let uncompressedTotal = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw invalidFile();
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if (uncompressedSize === 0xffffffff) throw new AppError('IMPORT_LIMIT_EXCEEDED', 400, 'Format arsip Excel tidak didukung.');
    uncompressedTotal += uncompressedSize;
    if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) throw new AppError('IMPORT_LIMIT_EXCEEDED', 400, 'Ukuran isi file Excel melebihi batas 20 MB.');
    offset += 46 + nameLength + extraLength + commentLength;
    if (offset > directoryOffset + directorySize) throw invalidFile();
  }
}

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null) {
    if ('formula' in value || 'sharedFormula' in value) {
      const result = 'result' in value ? value.result : undefined;
      return result ?? ('formula' in value ? value.formula : '');
    }
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value && typeof value.text === 'string') return value.text;
    return '';
  }
  return value;
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function excelSerialDate(value: number): string | null {
  if (!Number.isFinite(value) || value < 1) return null;
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
  const result = date.toISOString().slice(0, 10);
  return isValidDateOnly(result) ? result : null;
}

function parseDate(value: unknown, monthValue: unknown, yearValue: unknown, splitDate: boolean): string | null {
  let result: string | null = null;
  if (splitDate) {
    const dayText = stringValue(value);
    const day = /^\d{1,2}$/.test(dayText) ? Number(dayText) : 0;
    const monthText = stringValue(monthValue).toLowerCase();
    const month = /^\d{1,2}$/.test(monthText) ? Number(monthText) : MONTHS.get(monthText) ?? 0;
    const yearText = stringValue(yearValue);
    const year = /^\d{4}$/.test(yearText) ? Number(yearText) : 0;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        result = date.toISOString().slice(0, 10);
      }
    }
  } else if (value instanceof Date) {
    result = value.toISOString().slice(0, 10);
  } else if (typeof value === 'number') {
    result = excelSerialDate(value);
  } else {
    const text = stringValue(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text) && isValidDateOnly(text)) result = text;
    else {
      const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (year >= 2000 && year <= 2100 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
          result = date.toISOString().slice(0, 10);
        }
      }
    }
  }
  return result && result <= wibToday() ? result : null;
}

function parseType(value: unknown): 'income' | 'expense' | null {
  const normalized = stringValue(value).toLocaleLowerCase('id-ID');
  if (normalized === 'pemasukan' || normalized === 'income') return 'income';
  if (normalized === 'pengeluaran' || normalized === 'expense') return 'expense';
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 1 && value <= MAX_AMOUNT ? value : null;
  const text = stringValue(value).replace(/^rp\s*/i, '').replace(/\s+/g, '');
  if (!/^(?:\d+|\d{1,3}(?:[.,]\d{3})+)$/.test(text)) return null;
  const amount = Number(text.replace(/[.,]/g, ''));
  return Number.isSafeInteger(amount) && amount >= 1 && amount <= MAX_AMOUNT ? amount : null;
}

function duplicateKey(row: { transactionDate: string; type: string; amount: number; description: string | null }): string {
  return `${row.transactionDate}|${row.type}|${row.amount}|${row.description ?? ''}`;
}

export async function previewImport(userId: string, buffer: Buffer): Promise<ImportPreview> {
  inspectZip(buffer);
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = Buffer.from(buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  let timeout: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      workbook.xlsx.load(excelBuffer),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new AppError('IMPORT_LIMIT_EXCEEDED', 400, 'Pemrosesan file melewati batas waktu 15 detik.')), 15_000); }),
    ]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw invalidFile();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw invalidFile();
  if (worksheet.rowCount > MAX_ROWS + 1 || worksheet.columnCount > MAX_COLUMNS) {
    throw new AppError('IMPORT_LIMIT_EXCEEDED', 400, 'File Excel maksimal 1.000 baris data dan 10 kolom.');
  }
  const headerRow = worksheet.getRow(1);
  const indexes = new Map<string, number>();
  const unknown: string[] = [];
  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const label = stringValue(cellValue(headerRow.getCell(column).value as ExcelJS.CellValue));
    if (!label) continue;
    const canonical = [...ALLOWED, ...IGNORED].find((name) => name.toLowerCase() === label.toLowerCase());
    if (!canonical || indexes.has(canonical)) { unknown.push(label); continue; }
    indexes.set(canonical, column);
  }
  const missing: string[] = REQUIRED.filter((name) => !indexes.has(name));
  const splitPresent = indexes.has('Bulan') || indexes.has('Tahun');
  if (unknown.length || missing.length || (splitPresent && (!indexes.has('Bulan') || !indexes.has('Tahun')))) {
    if (splitPresent && (!indexes.has('Bulan') || !indexes.has('Tahun'))) {
      if (!indexes.has('Bulan')) missing.push('Bulan');
      if (!indexes.has('Tahun')) missing.push('Tahun');
    }
    throw new AppError('IMPORT_HEADER_MISMATCH', 400, 'Nama kolom pada file tidak sesuai aturan import.', {
      allowed: ALLOWED, ignored: IGNORED, required: REQUIRED, unknown, missing,
    });
  }

  const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true, nameKey: true, type: true } });
  const categoryKeys = new Set(categories.map((category) => `${category.type}:${category.nameKey}`));
  const rawRows: Array<{ row: number; status: 'valid' | 'invalid'; errors: string[]; parsed?: { type: 'income' | 'expense'; category: string; amount: number; transactionDate: string; description: string | null } }> = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const empty = [...indexes.values()].every((column) => stringValue(cellValue(row.getCell(column).value as ExcelJS.CellValue)) === '');
    if (empty) continue;
    const get = (name: string): unknown => cellValue(row.getCell(indexes.get(name)!).value as ExcelJS.CellValue);
    const errors: string[] = [];
    const type = parseType(get('Tipe'));
    const category = stringValue(get('Kategori'));
    const amount = parseAmount(get('Nominal'));
    const transactionDate = parseDate(get('Tanggal'), indexes.has('Bulan') ? get('Bulan') : undefined, indexes.has('Tahun') ? get('Tahun') : undefined, splitPresent);
    const rawDescription = stringValue(get('Deskripsi'));
    const description = rawDescription === '' ? null : rawDescription;
    if (!transactionDate) errors.push('Tanggal tidak dikenali atau melewati hari ini.');
    if (!type) errors.push('Tipe harus Pemasukan atau Pengeluaran.');
    if (!category || category.length > 50) errors.push('Kategori wajib diisi dan maksimal 50 karakter.');
    if (amount === null) errors.push('Nominal harus bilangan bulat rupiah yang valid.');
    if (rawDescription.length > 255) errors.push('Deskripsi maksimal 255 karakter.');
    if (errors.length || !type || !transactionDate || amount === null) {
      rawRows.push({ row: rowNumber, status: 'invalid', errors });
    } else {
      rawRows.push({ row: rowNumber, status: 'valid', errors: [], parsed: { type, category, amount, transactionDate, description } });
    }
  }

  const validRows = rawRows.filter((row) => row.parsed).map((row) => row.parsed!);
  const dates = validRows.map((row) => row.transactionDate).sort();
  const existing = dates.length ? await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: new Date(`${dates[0]}T00:00:00.000Z`), lte: new Date(`${dates[dates.length - 1]}T00:00:00.000Z`) } },
    select: { type: true, amount: true, transactionDate: true, description: true },
  }) : [];
  const seen = new Set(existing.map((row) => duplicateKey({
    transactionDate: row.transactionDate.toISOString().slice(0, 10), type: row.type,
    amount: Number(row.amount.toString()), description: row.description,
  })));
  const unknownCategories = new Set<string>();
  let duplicateCount = 0;
  let validCount = 0;
  const rows = rawRows.map((row) => {
    if (!row.parsed) return { row: row.row, status: row.status, errors: row.errors };
    const parsed = row.parsed;
    const key = `${parsed.type}:${parsed.category.trim().toLowerCase()}`;
    if (!categoryKeys.has(key)) unknownCategories.add(parsed.category);
    const duplicate = seen.has(duplicateKey(parsed));
    seen.add(duplicateKey(parsed));
    if (duplicate) duplicateCount += 1;
    else validCount += 1;
    return { row: row.row, status: 'valid', ...parsed, duplicate };
  });
  return {
    totalRows: rawRows.length,
    validCount,
    invalidCount: rawRows.length - validRows.length,
    duplicateCount,
    unknownCategories: [...unknownCategories].sort((a, b) => a.localeCompare(b)),
    rows,
  };
}
