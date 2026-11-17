import { AppError } from '../../lib/errors';

export interface InspectedImage {
  mimeType: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
}

function unsupported(): AppError {
  return new AppError('UNSUPPORTED_FILE', 415, 'File harus berupa gambar JPEG atau PNG.');
}

function invalidDimensions(): AppError {
  return new AppError('VALIDATION_ERROR', 400, 'Dimensi gambar maksimal 4096 × 4096 piksel.');
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isStartOfFrame) {
      if (length < 7) return null;
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

export function inspectReceiptImage(buffer: Buffer): InspectedImage {
  let image: InspectedImage;
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(pngSignature)
    && buffer.readUInt32BE(8) === 13 && buffer.subarray(12, 16).toString('ascii') === 'IHDR') {
    image = { mimeType: 'image/png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  } else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = jpegDimensions(buffer);
    if (!dimensions) throw unsupported();
    image = { mimeType: 'image/jpeg', ...dimensions };
  } else {
    throw unsupported();
  }
  if (image.width < 1 || image.height < 1 || image.width > 4096 || image.height > 4096) throw invalidDimensions();
  return image;
}
