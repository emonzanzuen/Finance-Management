import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { dateOnly } from '../../lib/dates';
import type { buildReportExportData } from './reports.service';

type ExportData = Awaited<ReturnType<typeof buildReportExportData>>;

function asText(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

export async function createXlsxReport(data: ExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinManage';
  workbook.subject = `Laporan keuangan IDR ${data.year}-${String(data.month).padStart(2, '0')}`;
  const summary = workbook.addWorksheet('Ringkasan');
  [
    ['Laporan Keuangan FinManage'],
    ['Nama Pengguna', asText(data.userName)],
    ['Periode', `${String(data.month).padStart(2, '0')}/${data.year}`],
    ['Mata Uang', 'IDR'],
    ['Total Pemasukan (IDR)', data.report.income],
    ['Total Pengeluaran (IDR)', data.report.expense],
    ['Selisih (IDR)', data.report.difference],
  ].forEach((row) => summary.addRow(row));
  summary.getRow(1).font = { bold: true, size: 16 };

  const categories = workbook.addWorksheet('Per Kategori');
  categories.addRow(['Tipe', 'Kategori', 'Nominal IDR', 'Persentase']);
  for (const item of data.report.incomeByCategory) categories.addRow(['Pemasukan', asText(item.name), item.amount, item.percentage]);
  for (const item of data.report.expenseByCategory) categories.addRow(['Pengeluaran', asText(item.name), item.amount, item.percentage]);
  categories.getRow(1).font = { bold: true };

  const transactions = workbook.addWorksheet('Transaksi');
  transactions.addRow(['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal IDR']);
  for (const item of data.transactions) {
    transactions.addRow([
      dateOnly(item.transactionDate),
      item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      asText(item.category.name),
      asText(item.description),
      Number(item.amount.toString()),
    ]);
  }
  transactions.getRow(1).font = { bold: true };
  transactions.columns = [{ width: 16 }, { width: 18 }, { width: 24 }, { width: 42 }, { width: 20 }];
  categories.columns = [{ width: 18 }, { width: 28 }, { width: 22 }, { width: 18 }];
  summary.columns = [{ width: 30 }, { width: 40 }];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function createPdfReport(data: ExportData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const period = `${String(data.month).padStart(2, '0')}/${data.year}`;
  doc.fontSize(18).font('Helvetica-Bold').text('Laporan Keuangan FinManage');
  doc.moveDown(0.4).fontSize(10).font('Helvetica').text(`Nama Pengguna: ${data.userName}`);
  doc.text(`Periode: ${period} | Mata Uang: IDR`);
  doc.moveDown().fontSize(13).font('Helvetica-Bold').text('Ringkasan (IDR)');
  doc.fontSize(10).font('Helvetica')
    .text(`Total Pemasukan: ${data.report.income.toLocaleString('id-ID')}`)
    .text(`Total Pengeluaran: ${data.report.expense.toLocaleString('id-ID')}`)
    .text(`Selisih / Net: ${data.report.difference.toLocaleString('id-ID')}`);

  const addSection = (title: string, headers: string[], rows: string[][], widths: number[]) => {
    doc.moveDown().fontSize(13).font('Helvetica-Bold').text(title);
    let y = doc.y + 6;
    const drawHeader = () => {
      let x = 40;
      doc.fontSize(8).font('Helvetica-Bold');
      headers.forEach((header, index) => { doc.text(header, x, y, { width: widths[index], ellipsis: true }); x += widths[index]!; });
      y += 18;
      doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor('#9CA3AF').stroke();
    };
    const newPage = () => { doc.addPage(); y = 40; drawHeader(); };
    drawHeader();
    for (const row of rows) {
      if (y > 760) newPage();
      let x = 40;
      doc.fontSize(8).font('Helvetica');
      row.forEach((value, index) => { doc.text(value, x, y, { width: widths[index], height: 28, ellipsis: true }); x += widths[index]!; });
      y += 17;
    }
    doc.y = y;
  };

  const categoryRows = [
    ...data.report.incomeByCategory.map((item) => ['Pemasukan', item.name, item.amount.toLocaleString('id-ID'), `${item.percentage}%`]),
    ...data.report.expenseByCategory.map((item) => ['Pengeluaran', item.name, item.amount.toLocaleString('id-ID'), `${item.percentage}%`]),
  ];
  addSection('Rincian per Kategori (IDR)', ['Tipe', 'Kategori', 'Nominal IDR', 'Persentase'], categoryRows, [90, 180, 145, 100]);
  const transactionRows = data.transactions.map((item) => [
    dateOnly(item.transactionDate), item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    item.category.name, item.description ?? '', item.amount.toNumber().toLocaleString('id-ID'),
  ]);
  addSection('Daftar Transaksi (IDR)', ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal IDR'], transactionRows, [70, 85, 105, 155, 100]);
  doc.end();
  return result;
}
