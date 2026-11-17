import type { MonthlyReportResponse, Transaction } from '@/types/api';

export interface PdfReportInput {
  month: number;
  year: number;
  userName?: string;
  userEmail?: string;
  report: MonthlyReportResponse;
  transactions: Transaction[];
}

const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89; // A4 height in pt
const MARGIN_X = 40;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 515.28 pt

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return [0.15, 0.39, 0.92];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return [0.15, 0.39, 0.92];
  }
  return [
    Math.round(r * 1000) / 1000,
    Math.round(g * 1000) / 1000,
    Math.round(b * 1000) / 1000,
  ];
}

/** Sanitize text to WinAnsi/ASCII safe characters & escape PDF string literals. */
function escapePdfText(raw: string): string {
  const normalized = raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
  return normalized
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Approximate text width in points for Helvetica / Helvetica-Bold. */
function measureTextWidth(text: string, fontSize: number, bold = false): number {
  let units = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if ('ilI.,:;!| '.includes(ch)) units += 0.28;
    else if ('ftj()[]/-'.includes(ch)) units += 0.35;
    else if ('mwMW@%'.includes(ch)) units += 0.82;
    else if (ch >= 'A' && ch <= 'Z') units += 0.68;
    else if (ch >= '0' && ch <= '9') units += 0.56;
    else units += 0.54;
  }
  return units * fontSize * (bold ? 1.04 : 1.0);
}

function truncateToWidth(text: string, maxWidth: number, fontSize: number, bold = false): string {
  const clean = text.trim();
  if (measureTextWidth(clean, fontSize, bold) <= maxWidth) return clean;
  let result = clean;
  while (result.length > 1 && measureTextWidth(`${result}...`, fontSize, bold) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}...`;
}

function formatRupiah(amount: number): string {
  const abs = Math.round(Math.abs(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

function formatShortDate(isoOrDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoOrDate);
  if (!m) return isoOrDate.slice(0, 10);
  const year = m[1];
  const monthIdx = Math.max(0, Math.min(11, parseInt(m[2]!, 10) - 1));
  const day = m[3];
  return `${day} ${SHORT_MONTHS[monthIdx]} ${year}`;
}

class PdfPageCanvas {
  private ops: string[] = [];

  fillRect(x: number, topY: number, w: number, h: number, hexColor: string): void {
    const [r, g, b] = hexToRgb(hexColor);
    const pdfY = PAGE_H - topY - h;
    this.ops.push(`${r} ${g} ${b} rg ${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  strokeRect(
    x: number,
    topY: number,
    w: number,
    h: number,
    hexColor: string,
    lineWidth = 1,
  ): void {
    const [r, g, b] = hexToRgb(hexColor);
    const pdfY = PAGE_H - topY - h;
    this.ops.push(
      `${lineWidth.toFixed(2)} w ${r} ${g} ${b} RG ${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`,
    );
  }

  fillAndStrokeRect(
    x: number,
    topY: number,
    w: number,
    h: number,
    fillHex: string,
    strokeHex: string,
    lineWidth = 1,
  ): void {
    this.fillRect(x, topY, w, h, fillHex);
    this.strokeRect(x, topY, w, h, strokeHex, lineWidth);
  }

  line(x1: number, topY1: number, x2: number, topY2: number, hexColor: string, lineWidth = 1): void {
    const [r, g, b] = hexToRgb(hexColor);
    const y1 = PAGE_H - topY1;
    const y2 = PAGE_H - topY2;
    this.ops.push(
      `${lineWidth.toFixed(2)} w ${r} ${g} ${b} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
  }

  text(
    str: string,
    x: number,
    topBaselineY: number,
    options?: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      color?: string;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    },
  ): void {
    const font = options?.font ?? 'F1';
    const size = options?.size ?? 10;
    const color = options?.color ?? '#0F172A';
    const align = options?.align ?? 'left';
    const bold = font === 'F2';
    const finalStr =
      options?.maxWidth !== undefined
        ? truncateToWidth(str, options.maxWidth, size, bold)
        : str;

    let drawX = x;
    if (align === 'right') {
      drawX = x - measureTextWidth(finalStr, size, bold);
    } else if (align === 'center') {
      drawX = x - measureTextWidth(finalStr, size, bold) / 2;
    }

    const [r, g, b] = hexToRgb(color);
    const pdfY = PAGE_H - topBaselineY;
    this.ops.push(
      `BT /${font} ${size.toFixed(2)} Tf ${r} ${g} ${b} rg ${drawX.toFixed(2)} ${pdfY.toFixed(2)} Td (${escapePdfText(finalStr)}) Tj ET`,
    );
  }

  toStream(): string {
    return this.ops.join('\n');
  }
}

export function generateProfessionalPdfReport(input: PdfReportInput): Uint8Array {
  const { month, year, report, transactions } = input;
  const monthName = INDONESIAN_MONTHS[Math.max(0, Math.min(11, month - 1))] ?? String(month);
  const periodLabel = `${monthName} ${year}`;
  const paddedPeriod = `${String(month).padStart(2, '0')}/${year}`;
  const userName = input.userName?.trim() || 'Pengguna FinManage';

  const now = new Date();
  const printedDate = `${String(now.getDate()).padStart(2, '0')} ${SHORT_MONTHS[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const pages: PdfPageCanvas[] = [];
  let currentPage = new PdfPageCanvas();
  pages.push(currentPage);
  let y = 0;

  const drawContinuationBanner = (page: PdfPageCanvas) => {
    page.fillRect(0, 0, PAGE_W, 48, '#0F172A');
    page.fillRect(0, 48, PAGE_W, 3, '#2563EB');
    page.text('FINMANAGE  |  LAPORAN KEUANGAN BULANAN', MARGIN_X, 29, {
      font: 'F2',
      size: 10,
      color: '#FFFFFF',
    });
    page.text(`Periode: ${periodLabel} (${paddedPeriod})`, PAGE_W - MARGIN_X, 29, {
      font: 'F1',
      size: 9,
      color: '#CBD5E1',
      align: 'right',
    });
  };

  // =========================================================================
  // 1. EXECUTIVE HERO HEADER BANNER (Page 1)
  // =========================================================================
  currentPage.fillRect(0, 0, PAGE_W, 112, '#0F172A');
  currentPage.fillRect(0, 112, PAGE_W, 4, '#2563EB');

  // Brand Pill
  currentPage.fillRect(MARGIN_X, 22, 162, 18, '#1E3A8A');
  currentPage.strokeRect(MARGIN_X, 22, 162, 18, '#3B82F6', 0.75);
  currentPage.text('FINMANAGE  •  LAPORAN RESMI', MARGIN_X + 81, 34, {
    font: 'F2',
    size: 7.5,
    color: '#93C5FD',
    align: 'center',
  });

  // Main Title & Subtitle
  currentPage.text('Laporan Keuangan Bulanan', MARGIN_X, 64, {
    font: 'F2',
    size: 20,
    color: '#FFFFFF',
  });
  currentPage.text(
    'Ringkasan Arus Kas, Distribusi Kategori & Riwayat Transaksi (IDR)',
    MARGIN_X,
    82,
    {
      font: 'F1',
      size: 9.5,
      color: '#94A3B8',
    },
  );
  currentPage.text(`Pemilik Akun: ${userName}`, MARGIN_X, 98, {
    font: 'F2',
    size: 9.5,
    color: '#E2E8F0',
    maxWidth: 300,
  });

  // Right Metadata Box inside Header
  const metaBoxW = 175;
  const metaBoxX = PAGE_W - MARGIN_X - metaBoxW;
  currentPage.fillAndStrokeRect(metaBoxX, 20, metaBoxW, 78, '#1E293B', '#334155', 1);
  currentPage.text('PERIODE LAPORAN', metaBoxX + 12, 36, {
    font: 'F2',
    size: 7.5,
    color: '#93C5FD',
  });
  currentPage.text(periodLabel.toUpperCase(), metaBoxX + 12, 52, {
    font: 'F2',
    size: 13,
    color: '#FFFFFF',
  });
  currentPage.line(metaBoxX + 12, 60, metaBoxX + metaBoxW - 12, 60, '#334155', 0.75);
  currentPage.text(`Dicetak: ${printedDate}`, metaBoxX + 12, 74, {
    font: 'F1',
    size: 8,
    color: '#CBD5E1',
  });
  currentPage.text('Mata Uang: IDR (Rupiah)', metaBoxX + 12, 88, {
    font: 'F1',
    size: 8,
    color: '#94A3B8',
  });

  y = 134;

  // =========================================================================
  // 2. EXECUTIVE SUMMARY — 3 METRIC CARDS
  // =========================================================================
  const cardGap = 10;
  const cardW = (CONTENT_W - cardGap * 2) / 3; // ~165.09 pt
  const cardH = 72;

  const isSurplus = report.difference >= 0;
  const savingsRate =
    report.income > 0
      ? Math.round(((report.income - report.expense) / report.income) * 1000) / 10
      : 0;

  // Card 1: Total Pemasukan
  const c1X = MARGIN_X;
  currentPage.fillAndStrokeRect(c1X, y, cardW, cardH, '#ECFDF5', '#A7F3D0', 1);
  currentPage.fillRect(c1X, y, cardW, 4, '#10B981');
  currentPage.text('TOTAL PEMASUKAN', c1X + 12, y + 21, {
    font: 'F2',
    size: 8,
    color: '#047857',
  });
  currentPage.text(`+ ${formatRupiah(report.income)}`, c1X + 12, y + 43, {
    font: 'F2',
    size: 13,
    color: '#065F46',
    maxWidth: cardW - 24,
  });
  currentPage.text(
    `${report.incomeByCategory.length} kategori pemasukan`,
    c1X + 12,
    y + 60,
    {
      font: 'F1',
      size: 8,
      color: '#059669',
    },
  );

  // Card 2: Total Pengeluaran
  const c2X = MARGIN_X + cardW + cardGap;
  currentPage.fillAndStrokeRect(c2X, y, cardW, cardH, '#FEF2F2', '#FECACA', 1);
  currentPage.fillRect(c2X, y, cardW, 4, '#EF4444');
  currentPage.text('TOTAL PENGELUARAN', c2X + 12, y + 21, {
    font: 'F2',
    size: 8,
    color: '#B91C1C',
  });
  currentPage.text(`- ${formatRupiah(report.expense)}`, c2X + 12, y + 43, {
    font: 'F2',
    size: 13,
    color: '#991B1B',
    maxWidth: cardW - 24,
  });
  currentPage.text(
    `${report.expenseByCategory.length} kategori pengeluaran`,
    c2X + 12,
    y + 60,
    {
      font: 'F1',
      size: 8,
      color: '#DC2626',
    },
  );

  // Card 3: Selisih / Arus Kas Bersih
  const c3X = MARGIN_X + (cardW + cardGap) * 2;
  const netBg = isSurplus ? '#EFF6FF' : '#FFFBEB';
  const netBorder = isSurplus ? '#BFDBFE' : '#FDE68A';
  const netAccent = isSurplus ? '#2563EB' : '#D97706';
  const netTitleColor = isSurplus ? '#1D4ED8' : '#B45309';
  const netValueColor = isSurplus ? '#1E3A8A' : '#92400E';

  currentPage.fillAndStrokeRect(c3X, y, cardW, cardH, netBg, netBorder, 1);
  currentPage.fillRect(c3X, y, cardW, 4, netAccent);
  currentPage.text('SELISIH BERSIH (NET)', c3X + 12, y + 21, {
    font: 'F2',
    size: 8,
    color: netTitleColor,
  });
  currentPage.text(
    `${isSurplus ? '+' : '-'} ${formatRupiah(report.difference)}`,
    c3X + 12,
    y + 43,
    {
      font: 'F2',
      size: 13,
      color: netValueColor,
      maxWidth: cardW - 24,
    },
  );
  currentPage.text(
    isSurplus
      ? `Status: SURPLUS (${savingsRate}% rasio hemat)`
      : 'Status: DEFISIT (Pengeluaran > Pemasukan)',
    c3X + 12,
    y + 60,
    {
      font: 'F1',
      size: 7.5,
      color: netTitleColor,
      maxWidth: cardW - 24,
    },
  );

  y += cardH + 22;

  // =========================================================================
  // 3. SECTION 1: RINCIAN PER KATEGORI TABLE (WITH VISUAL PROGRESS BAR)
  // =========================================================================
  const drawSectionHeading = (
    page: PdfPageCanvas,
    topY: number,
    title: string,
    rightBadge: string,
  ) => {
    page.fillRect(MARGIN_X, topY, 4, 18, '#2563EB');
    page.text(title, MARGIN_X + 10, topY + 13, {
      font: 'F2',
      size: 12,
      color: '#0F172A',
    });
    page.text(rightBadge, PAGE_W - MARGIN_X, topY + 13, {
      font: 'F2',
      size: 8.5,
      color: '#64748B',
      align: 'right',
    });
  };

  const categoryRows = [
    ...report.incomeByCategory.map((item) => ({
      type: 'income' as const,
      typeLabel: 'Pemasukan',
      name: item.name,
      color: item.color || '#10B981',
      amount: item.amount,
      percentage: item.percentage,
    })),
    ...report.expenseByCategory.map((item) => ({
      type: 'expense' as const,
      typeLabel: 'Pengeluaran',
      name: item.name,
      color: item.color || '#EF4444',
      amount: item.amount,
      percentage: item.percentage,
    })),
  ];

  drawSectionHeading(
    currentPage,
    y,
    '1. Rincian per Kategori',
    `${categoryRows.length} Kategori`,
  );
  y += 24;

  const drawCategoryTableHeader = (page: PdfPageCanvas, topY: number) => {
    page.fillRect(MARGIN_X, topY, CONTENT_W, 24, '#1E293B');
    page.text('NO', MARGIN_X + 8, topY + 15.5, { font: 'F2', size: 8, color: '#F8FAFC' });
    page.text('TIPE', MARGIN_X + 36, topY + 15.5, { font: 'F2', size: 8, color: '#F8FAFC' });
    page.text('KATEGORI', MARGIN_X + 114, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
    });
    page.text('PROPORSI VISUAL', MARGIN_X + 265, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
    });
    page.text('PORSI', MARGIN_X + 412, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
      align: 'right',
    });
    page.text('NOMINAL (IDR)', MARGIN_X + CONTENT_W - 8, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
      align: 'right',
    });
  };

  drawCategoryTableHeader(currentPage, y);
  y += 24;

  if (categoryRows.length === 0) {
    currentPage.fillAndStrokeRect(MARGIN_X, y, CONTENT_W, 32, '#F8FAFC', '#E2E8F0', 1);
    currentPage.text(
      'Belum ada data pemasukan atau pengeluaran pada periode ini.',
      MARGIN_X + CONTENT_W / 2,
      y + 20,
      {
        font: 'F3',
        size: 9,
        color: '#64748B',
        align: 'center',
      },
    );
    y += 32;
  } else {
    categoryRows.forEach((row, index) => {
      const rowH = 22;
      if (y + rowH > 765) {
        currentPage = new PdfPageCanvas();
        pages.push(currentPage);
        drawContinuationBanner(currentPage);
        y = 66;
        drawCategoryTableHeader(currentPage, y);
        y += 24;
      }

      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      currentPage.fillRect(MARGIN_X, y, CONTENT_W, rowH, rowBg);
      currentPage.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_W, y + rowH, '#E2E8F0', 0.6);

      // No
      currentPage.text(String(index + 1), MARGIN_X + 8, y + 14.5, {
        font: 'F1',
        size: 8.5,
        color: '#64748B',
      });

      // Type Pill Badge
      const isInc = row.type === 'income';
      const badgeBg = isInc ? '#DCFCE7' : '#FEE2E2';
      const badgeFg = isInc ? '#166534' : '#991B1B';
      currentPage.fillRect(MARGIN_X + 36, y + 4.5, 66, 13, badgeBg);
      currentPage.text(row.typeLabel, MARGIN_X + 69, y + 13.5, {
        font: 'F2',
        size: 7.5,
        color: badgeFg,
        align: 'center',
      });

      // Category Swatch + Name
      currentPage.fillRect(MARGIN_X + 114, y + 7.5, 7, 7, row.color);
      currentPage.text(row.name, MARGIN_X + 126, y + 14.5, {
        font: 'F2',
        size: 8.5,
        color: '#0F172A',
        maxWidth: 130,
      });

      // Visual Progress Bar
      const barX = MARGIN_X + 265;
      const barW = 100;
      const barH = 7;
      const barY = y + 7.5;
      const pct = Math.max(0, Math.min(100, Number(row.percentage) || 0));
      currentPage.fillRect(barX, barY, barW, barH, '#E2E8F0');
      if (pct > 0) {
        const fillW = Math.max(3, (barW * pct) / 100);
        currentPage.fillRect(barX, barY, fillW, barH, isInc ? '#10B981' : '#EF4444');
      }

      // Percentage
      currentPage.text(`${pct.toFixed(1)}%`, MARGIN_X + 412, y + 14.5, {
        font: 'F2',
        size: 8.5,
        color: '#334155',
        align: 'right',
      });

      // Nominal
      currentPage.text(formatRupiah(row.amount), MARGIN_X + CONTENT_W - 8, y + 14.5, {
        font: 'F2',
        size: 8.5,
        color: isInc ? '#047857' : '#B91C1C',
        align: 'right',
      });

      y += rowH;
    });
  }

  y += 22;

  // =========================================================================
  // 4. SECTION 2: DAFTAR RIWAYAT TRANSAKSI LENGKAP
  // =========================================================================
  if (y + 65 > 765) {
    currentPage = new PdfPageCanvas();
    pages.push(currentPage);
    drawContinuationBanner(currentPage);
    y = 66;
  }

  drawSectionHeading(
    currentPage,
    y,
    '2. Daftar Riwayat Transaksi',
    `Total: ${transactions.length} Transaksi`,
  );
  y += 24;

  const drawTransactionTableHeader = (page: PdfPageCanvas, topY: number) => {
    page.fillRect(MARGIN_X, topY, CONTENT_W, 24, '#1E293B');
    page.text('NO', MARGIN_X + 8, topY + 15.5, { font: 'F2', size: 8, color: '#F8FAFC' });
    page.text('TANGGAL', MARGIN_X + 34, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
    });
    page.text('TIPE', MARGIN_X + 104, topY + 15.5, { font: 'F2', size: 8, color: '#F8FAFC' });
    page.text('KATEGORI', MARGIN_X + 178, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
    });
    page.text('DESKRIPSI / CATATAN', MARGIN_X + 286, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
    });
    page.text('NOMINAL (IDR)', MARGIN_X + CONTENT_W - 8, topY + 15.5, {
      font: 'F2',
      size: 8,
      color: '#F8FAFC',
      align: 'right',
    });
  };

  drawTransactionTableHeader(currentPage, y);
  y += 24;

  if (transactions.length === 0) {
    currentPage.fillAndStrokeRect(MARGIN_X, y, CONTENT_W, 32, '#F8FAFC', '#E2E8F0', 1);
    currentPage.text(
      'Tidak ada transaksi yang tercatat pada periode ini.',
      MARGIN_X + CONTENT_W / 2,
      y + 20,
      {
        font: 'F3',
        size: 9,
        color: '#64748B',
        align: 'center',
      },
    );
    y += 32;
  } else {
    transactions.forEach((tx, index) => {
      const rowH = 22;
      if (y + rowH > 765) {
        currentPage = new PdfPageCanvas();
        pages.push(currentPage);
        drawContinuationBanner(currentPage);
        y = 66;
        drawTransactionTableHeader(currentPage, y);
        y += 24;
      }

      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      currentPage.fillRect(MARGIN_X, y, CONTENT_W, rowH, rowBg);
      currentPage.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_W, y + rowH, '#E2E8F0', 0.6);

      // No
      currentPage.text(String(index + 1), MARGIN_X + 8, y + 14.5, {
        font: 'F1',
        size: 8,
        color: '#64748B',
      });

      // Tanggal
      currentPage.text(formatShortDate(tx.transactionDate), MARGIN_X + 34, y + 14.5, {
        font: 'F1',
        size: 8,
        color: '#334155',
      });

      // Tipe Badge
      const isInc = tx.type === 'income';
      const badgeBg = isInc ? '#DCFCE7' : '#FEE2E2';
      const badgeFg = isInc ? '#166534' : '#991B1B';
      currentPage.fillRect(MARGIN_X + 104, y + 4.5, 64, 13, badgeBg);
      currentPage.text(isInc ? 'Pemasukan' : 'Pengeluaran', MARGIN_X + 136, y + 13.5, {
        font: 'F2',
        size: 7.5,
        color: badgeFg,
        align: 'center',
      });

      // Kategori
      const catColor = tx.category?.color || (isInc ? '#10B981' : '#EF4444');
      currentPage.fillRect(MARGIN_X + 178, y + 8, 6, 6, catColor);
      currentPage.text(tx.category?.name || '-', MARGIN_X + 188, y + 14.5, {
        font: 'F2',
        size: 8,
        color: '#0F172A',
        maxWidth: 92,
      });

      // Deskripsi
      currentPage.text(tx.description?.trim() || '-', MARGIN_X + 286, y + 14.5, {
        font: 'F1',
        size: 8,
        color: '#475569',
        maxWidth: 125,
      });

      // Nominal
      const sign = isInc ? '+' : '-';
      currentPage.text(
        `${sign} ${formatRupiah(Number(tx.amount) || 0)}`,
        MARGIN_X + CONTENT_W - 8,
        y + 14.5,
        {
          font: 'F2',
          size: 8.5,
          color: isInc ? '#047857' : '#B91C1C',
          align: 'right',
        },
      );

      y += rowH;
    });

    // Total Summary Row at bottom of transaction table
    if (y + 26 <= 775) {
      currentPage.fillAndStrokeRect(MARGIN_X, y, CONTENT_W, 25, '#F1F5F9', '#CBD5E1', 0.8);
      currentPage.text(
        'SELISIH BERSIH PERIODE INI (PEMASUKAN - PENGELUARAN)',
        MARGIN_X + 10,
        y + 16,
        {
          font: 'F2',
          size: 8.5,
          color: '#0F172A',
        },
      );
      currentPage.text(
        `${isSurplus ? '+' : '-'} ${formatRupiah(report.difference)}`,
        MARGIN_X + CONTENT_W - 8,
        y + 16,
        {
          font: 'F2',
          size: 9.5,
          color: isSurplus ? '#1D4ED8' : '#B91C1C',
          align: 'right',
        },
      );
    }
  }

  // =========================================================================
  // 5. FOOTER ON EVERY PAGE
  // =========================================================================
  const totalPages = pages.length;
  pages.forEach((page, idx) => {
    page.line(MARGIN_X, 796, PAGE_W - MARGIN_X, 796, '#CBD5E1', 0.75);
    page.text(
      `FinManage Personal Finance  •  Laporan Periode ${periodLabel}  •  Dokumen Resmi`,
      MARGIN_X,
      812,
      {
        font: 'F1',
        size: 8,
        color: '#64748B',
      },
    );
    page.text(`Halaman ${idx + 1} dari ${totalPages}`, PAGE_W - MARGIN_X, 812, {
      font: 'F2',
      size: 8,
      color: '#475569',
      align: 'right',
    });
  });

  // =========================================================================
  // 6. SERIALIZE VALID PDF 1.4 BINARY
  // =========================================================================
  return buildPdfDocument(pages.map((p) => p.toStream()));
}

function buildPdfDocument(pageStreams: string[]): Uint8Array {
  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1 (Helvetica)
  // 4: Font F2 (Helvetica-Bold)
  // 5: Font F3 (Helvetica-Oblique)
  // For each page i (0..N-1):
  //   Page Obj ID = 6 + i * 2
  //   Content Stream Obj ID = 7 + i * 2
  const objects: string[] = [];

  const pageObjIds = pageStreams.map((_, i) => 6 + i * 2);

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj`,
  );
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj',
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj',
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj',
  );

  pageStreams.forEach((stream, i) => {
    const pageId = 6 + i * 2;
    const contentId = 7 + i * 2;
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`,
    );
    objects.push(
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0]; // index 0 is free object

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }

  const xrefOffset = pdf.length;
  const totalObjects = objects.length + 1;
  pdf += `xref\n0 ${totalObjects}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < totalObjects; i++) {
    const off = String(offsets[i] ?? 0).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return bytes;
}
