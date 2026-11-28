/**
 * Generator PDF Vektor Profesional (Zero-Dependency, PDF 1.4)
 * Menghasilkan dokumen laporan eksekutif A4 langsung di browser dari data backend.
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 36;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_LIMIT_Y = PAGE_H - 54;

const COLORS = {
  navy: "#0F172A",
  slateDark: "#1E293B",
  slateBorder: "#334155",
  slateMuted: "#64748B",
  slateLight: "#94A3B8",
  royalBlue: "#2563EB",
  white: "#FFFFFF",
  zebra: "#F8FAFC",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",

  greenSoft: "#ECFDF5",
  greenBorder: "#A7F3D0",
  greenAccent: "#10B981",
  greenPillBg: "#DCFCE7",
  greenText: "#047857",

  redSoft: "#FEF2F2",
  redBorder: "#FECACA",
  redAccent: "#EF4444",
  redPillBg: "#FEE2E2",
  redText: "#B91C1C",

  blueSoft: "#EFF6FF",
  blueBorder: "#BFDBFE",
  blueText: "#1D4ED8",

  orangeSoft: "#FFF7ED",
  orangeBorder: "#FED7AA",
  orangeAccent: "#F97316",
  orangeText: "#C2410C",
};

// Estimasi lebar karakter rata-rata Helvetica (unit per 1pt fontSize)
const CHAR_WIDTH_MAP = {
  " ": 0.28, "!": 0.28, ".": 0.28, ",": 0.28, ":": 0.28, ";": 0.28,
  "'": 0.19, '"': 0.35, "|": 0.26, "/": 0.28, "-": 0.33, "(": 0.33, ")": 0.33,
  i: 0.22, l: 0.22, I: 0.28, j: 0.22, t: 0.28, f: 0.28, r: 0.33,
  m: 0.83, w: 0.72, M: 0.83, W: 0.94, "%": 0.89, "+": 0.58,
};

function estimateTextWidth(text, fontSize, isBold = false) {
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (CHAR_WIDTH_MAP[ch] !== undefined) {
      sum += CHAR_WIDTH_MAP[ch];
    } else if (ch >= "0" && ch <= "9") {
      sum += 0.56;
    } else if (ch >= "A" && ch <= "Z") {
      sum += 0.67;
    } else {
      sum += 0.52;
    }
  }
  return sum * fontSize * (isBold ? 1.05 : 1);
}

function truncateText(text, maxWidth, fontSize, isBold = false) {
  const str = String(text ?? "").trim();
  if (!str) return "-";
  if (estimateTextWidth(str, fontSize, isBold) <= maxWidth) return str;
  const ellipsis = "...";
  let out = str;
  while (out.length > 1 && estimateTextWidth(out + ellipsis, fontSize, isBold) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out.trimEnd() + ellipsis;
}

/**
 * Mengubah teks Unicode menjadi string ASCII + octal WinAnsiEncoding yang aman untuk PDF.
 */
function encodePdfText(input) {
  const normalized = String(input ?? "")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");

  let result = "";
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    if (code === 0x2022) {
      result += "\\225"; // bullet (•) di WinAnsiEncoding
    } else if (code === 0x28 || code === 0x29 || code === 0x5c) {
      result += "\\" + normalized[i];
    } else if (code >= 0x20 && code <= 0x7e) {
      result += normalized[i];
    } else if (code >= 0xa0 && code <= 0xff) {
      result += "\\" + code.toString(8).padStart(3, "0");
    }
  }
  return result;
}

function hexToRgb(hex, fallback = [0.06, 0.09, 0.16]) {
  if (typeof hex !== "string") return fallback;
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

function fmtNum(n) {
  return Number(n).toFixed(2);
}

function formatIDR(amount) {
  const num = Math.round(Math.abs(Number(amount || 0)));
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatSignedIDR(amount, forceType = null) {
  const num = Number(amount || 0);
  if (forceType === "income") return `+ ${formatIDR(num)}`;
  if (forceType === "expense") return `- ${formatIDR(num)}`;
  if (num > 0) return `+ ${formatIDR(num)}`;
  if (num < 0) return `- ${formatIDR(num)}`;
  return formatIDR(0);
}

function formatShortDate(dateStr, isEn) {
  if (!dateStr) return "-";
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return String(dateStr);
  return new Date(y, m - 1, d).toLocaleDateString(isEn ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

class PdfDocBuilder {
  constructor() {
    this.pages = [];
    this.current = [];
  }

  newPage() {
    this.current = [];
    this.pages.push(this.current);
  }

  cmd(line) {
    this.current.push(line);
  }

  setFill(hex) {
    const [r, g, b] = hexToRgb(hex);
    this.cmd(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  setStroke(hex, lineWidth = 0.75) {
    const [r, g, b] = hexToRgb(hex);
    this.cmd(`${fmtNum(lineWidth)} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  rect(x, topY, w, h, { fill = null, stroke = null, lineWidth = 0.75, radius = 0 } = {}) {
    const y = PAGE_H - topY - h;
    if (fill) this.setFill(fill);
    if (stroke) this.setStroke(stroke, lineWidth);

    const r = Math.min(radius, w / 2, h / 2);
    if (r <= 0.1) {
      this.cmd(`${fmtNum(x)} ${fmtNum(y)} ${fmtNum(w)} ${fmtNum(h)} re`);
    } else {
      const k = 0.55228475 * r;
      this.cmd(`${fmtNum(x + r)} ${fmtNum(y)} m`);
      this.cmd(`${fmtNum(x + w - r)} ${fmtNum(y)} l`);
      this.cmd(
        `${fmtNum(x + w - r + k)} ${fmtNum(y)} ${fmtNum(x + w)} ${fmtNum(y + r - k)} ${fmtNum(x + w)} ${fmtNum(y + r)} c`
      );
      this.cmd(`${fmtNum(x + w)} ${fmtNum(y + h - r)} l`);
      this.cmd(
        `${fmtNum(x + w)} ${fmtNum(y + h - r + k)} ${fmtNum(x + w - r + k)} ${fmtNum(y + h)} ${fmtNum(x + w - r)} ${fmtNum(y + h)} c`
      );
      this.cmd(`${fmtNum(x + r)} ${fmtNum(y + h)} l`);
      this.cmd(
        `${fmtNum(x + r - k)} ${fmtNum(y + h)} ${fmtNum(x)} ${fmtNum(y + h - r + k)} ${fmtNum(x)} ${fmtNum(y + h - r)} c`
      );
      this.cmd(`${fmtNum(x)} ${fmtNum(y + r)} l`);
      this.cmd(
        `${fmtNum(x)} ${fmtNum(y + r - k)} ${fmtNum(x + r - k)} ${fmtNum(y)} ${fmtNum(x + r)} ${fmtNum(y)} c`
      );
      this.cmd("h");
    }

    if (fill && stroke) this.cmd("B");
    else if (fill) this.cmd("f");
    else if (stroke) this.cmd("S");
  }

  line(x1, topY1, x2, topY2, strokeHex = COLORS.border, lineWidth = 0.75) {
    this.setStroke(strokeHex, lineWidth);
    this.cmd(
      `${fmtNum(x1)} ${fmtNum(PAGE_H - topY1)} m ${fmtNum(x2)} ${fmtNum(PAGE_H - topY2)} l S`
    );
  }

  text(str, x, topY, { size = 10, bold = false, color = COLORS.textPrimary, align = "left", maxWidth = null } = {}) {
    let display = String(str ?? "");
    if (maxWidth !== null) {
      display = truncateText(display, maxWidth, size, bold);
    }
    let drawX = x;
    const width = estimateTextWidth(display, size, bold);
    if (align === "right") drawX = x - width;
    else if (align === "center") drawX = x - width / 2;

    const baselineY = PAGE_H - (topY + size * 0.8);
    this.setFill(color);
    this.cmd(
      `BT /${bold ? "F2" : "F1"} ${fmtNum(size)} Tf 1 0 0 1 ${fmtNum(drawX)} ${fmtNum(baselineY)} Tm (${encodePdfText(display)}) Tj ET`
    );
  }

  pill(label, x, topY, { bg, color, size = 7.5, padX = 6, height = 14 } = {}) {
    const textW = estimateTextWidth(label, size, true);
    const w = textW + padX * 2;
    this.rect(x, topY, w, height, { fill: bg, radius: height / 2 });
    this.text(label, x + w / 2, topY + (height - size) / 2 - 0.5, {
      size,
      bold: true,
      color,
      align: "center",
    });
    return w;
  }

  buildBlob() {
    const objects = [];
    const totalPages = this.pages.length;

    // 1: Catalog, 2: Pages, 3: Helvetica, 4: Helvetica-Bold
    const pageObjIds = [];
    for (let i = 0; i < totalPages; i += 1) {
      pageObjIds.push(5 + i * 2);
    }

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${totalPages} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    for (let i = 0; i < totalPages; i += 1) {
      const pageId = 5 + i * 2;
      const streamId = 6 + i * 2;
      const content = this.pages[i].join("\n") + "\n";

      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmtNum(PAGE_W)} ${fmtNum(PAGE_H)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
      objects[streamId] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
    }

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    const maxObjId = objects.length - 1;

    for (let id = 1; id <= maxObjId; id += 1) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${maxObjId + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let id = 1; id <= maxObjId; id += 1) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) {
      bytes[i] = pdf.charCodeAt(i) & 0xff;
    }
    return new Blob([bytes], { type: "application/pdf" });
  }
}

/**
 * Menyusun file PDF Laporan Keuangan Bulanan FinManage (Blob application/pdf).
 */
export function generateMonthlyReportPdf({
  month,
  year,
  monthlyReport,
  transactions = [],
  userName = "Pengguna FinManage",
  language = "id",
}) {
  const isEn = language === "en";
  const locale = isEn ? "en-US" : "id-ID";
  const periodTitle = new Date(year, month - 1, 1)
    .toLocaleDateString(locale, { month: "long", year: "numeric" })
    .toUpperCase();
  const printedAt = new Date().toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const income = Number(monthlyReport?.income || 0);
  const expense = Number(monthlyReport?.expense || 0);
  const difference = Number(monthlyReport?.difference ?? income - expense);
  const incomeCats = monthlyReport?.incomeByCategory ?? [];
  const expenseCats = monthlyReport?.expenseByCategory ?? [];
  const isSurplus = difference >= 0;
  const savingsRate = income > 0 ? ((difference / income) * 100).toFixed(1) : null;

  const doc = new PdfDocBuilder();
  let y = 0;

  // ---------- Continuation Header untuk halaman 2+ ----------
  const addContinuationPage = () => {
    doc.newPage();
    doc.rect(0, 0, PAGE_W, 38, { fill: COLORS.navy });
    doc.rect(0, 38, PAGE_W, 3, { fill: COLORS.royalBlue });
    doc.text(
      isEn
        ? "FINMANAGE  \u2022  MONTHLY FINANCIAL REPORT"
        : "FINMANAGE  \u2022  LAPORAN KEUANGAN BULANAN",
      MARGIN_X,
      14,
      { size: 9, bold: true, color: COLORS.white }
    );
    doc.text(periodTitle, PAGE_W - MARGIN_X, 14, {
      size: 9,
      bold: true,
      color: COLORS.slateLight,
      align: "right",
    });
    y = 56;
  };

  // ---------- Halaman 1: Executive Header Banner ----------
  doc.newPage();
  doc.rect(0, 0, PAGE_W, 102, { fill: COLORS.navy });
  doc.rect(0, 102, PAGE_W, 4, { fill: COLORS.royalBlue });

  // Badge kiri atas
  doc.pill(
    isEn ? "FINMANAGE  \u2022  OFFICIAL REPORT" : "FINMANAGE  \u2022  LAPORAN RESMI",
    MARGIN_X,
    18,
    { bg: COLORS.royalBlue, color: COLORS.white, size: 7.5, padX: 8, height: 16 }
  );

  doc.text(
    isEn ? "Monthly Financial Report" : "Laporan Keuangan Bulanan",
    MARGIN_X,
    42,
    { size: 18, bold: true, color: COLORS.white }
  );
  doc.text(
    isEn
      ? "Executive Summary of Income, Expenses & Cashflow"
      : "Ringkasan Eksekutif Pemasukan, Pengeluaran & Arus Kas",
    MARGIN_X,
    67,
    { size: 9, color: COLORS.slateLight }
  );

  // Kotak Metadata Periode di kanan
  const metaW = 192;
  const metaX = PAGE_W - MARGIN_X - metaW;
  doc.rect(metaX, 16, metaW, 72, {
    fill: COLORS.slateDark,
    stroke: COLORS.slateBorder,
    lineWidth: 0.75,
    radius: 6,
  });
  doc.text(periodTitle, metaX + 12, 24, {
    size: 10.5,
    bold: true,
    color: COLORS.white,
    maxWidth: metaW - 24,
  });
  doc.text(`${isEn ? "Printed" : "Dicetak"}: ${printedAt}`, metaX + 12, 41, {
    size: 7.5,
    color: COLORS.slateLight,
    maxWidth: metaW - 24,
  });
  doc.text(`${isEn ? "Owner" : "Pemilik"}: ${userName || "User"}`, metaX + 12, 54, {
    size: 7.5,
    color: COLORS.slateLight,
    maxWidth: metaW - 24,
  });
  doc.text(`${isEn ? "Currency" : "Mata Uang"}: IDR (Rupiah)`, metaX + 12, 67, {
    size: 7.5,
    color: COLORS.slateLight,
    maxWidth: metaW - 24,
  });

  y = 122;

  // ---------- 3 Kartu Ringkasan Eksekutif ----------
  const cardGap = 12;
  const cardW = (CONTENT_W - cardGap * 2) / 3;
  const cardH = 74;

  const summaryCards = [
    {
      label: isEn ? "TOTAL INCOME" : "TOTAL PEMASUKAN",
      value: formatSignedIDR(income, "income"),
      subtext: isEn
        ? `${incomeCats.length} active categories`
        : `${incomeCats.length} kategori aktif`,
      bg: COLORS.greenSoft,
      border: COLORS.greenBorder,
      accent: COLORS.greenAccent,
      valueColor: COLORS.greenText,
    },
    {
      label: isEn ? "TOTAL EXPENSE" : "TOTAL PENGELUARAN",
      value: formatSignedIDR(expense, "expense"),
      subtext: isEn
        ? `${expenseCats.length} active categories`
        : `${expenseCats.length} kategori aktif`,
      bg: COLORS.redSoft,
      border: COLORS.redBorder,
      accent: COLORS.redAccent,
      valueColor: COLORS.redText,
    },
    {
      label: isEn
        ? `NET CASHFLOW (${isSurplus ? "SURPLUS" : "DEFICIT"})`
        : `SELISIH BERSIH (${isSurplus ? "SURPLUS" : "DEFISIT"})`,
      value: formatSignedIDR(difference),
      subtext:
        savingsRate !== null
          ? `${isEn ? "Savings Rate" : "Rasio Hemat"}: ${savingsRate}%`
          : `${isEn ? "Savings Rate" : "Rasio Hemat"}: -`,
      bg: isSurplus ? COLORS.blueSoft : COLORS.orangeSoft,
      border: isSurplus ? COLORS.blueBorder : COLORS.orangeBorder,
      accent: isSurplus ? COLORS.royalBlue : COLORS.orangeAccent,
      valueColor: isSurplus ? COLORS.blueText : COLORS.orangeText,
    },
  ];

  summaryCards.forEach((card, idx) => {
    const cx = MARGIN_X + idx * (cardW + cardGap);
    doc.rect(cx, y, cardW, cardH, {
      fill: card.bg,
      stroke: card.border,
      lineWidth: 0.75,
      radius: 6,
    });
    // Garis aksen atas
    doc.rect(cx + 1, y + 0.5, cardW - 2, 3.5, { fill: card.accent, radius: 1.5 });
    doc.text(card.label, cx + 11, y + 13, {
      size: 7.2,
      bold: true,
      color: COLORS.textSecondary,
      maxWidth: cardW - 22,
    });
    doc.text(card.value, cx + 11, y + 29, {
      size: 13.5,
      bold: true,
      color: card.valueColor,
      maxWidth: cardW - 22,
    });
    doc.text(card.subtext, cx + 11, y + 53, {
      size: 7.8,
      color: COLORS.slateMuted,
      maxWidth: cardW - 22,
    });
  });

  y += cardH + 22;

  // ---------- Tabel 1: Rincian per Kategori dengan Visual Progress Bar ----------
  const catRows = [
    ...incomeCats.map((c) => ({ ...c, type: "income" })),
    ...expenseCats.map((c) => ({ ...c, type: "expense" })),
  ];

  const catCols = {
    no: MARGIN_X + 8,
    type: MARGIN_X + 34,
    name: MARGIN_X + 108,
    bar: MARGIN_X + 244,
    barW: 112,
    pct: MARGIN_X + 412,
    amount: PAGE_W - MARGIN_X - 8,
  };

  const drawCategoryTableHeader = () => {
    doc.rect(MARGIN_X, y, CONTENT_W, 22, { fill: COLORS.slateDark, radius: 4 });
    doc.text("NO", catCols.no, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "TYPE" : "TIPE", catCols.type, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "CATEGORY" : "KATEGORI", catCols.name, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "VISUAL SHARE" : "PROPORSI VISUAL", catCols.bar, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "SHARE" : "PORSI", catCols.pct, y + 7, { size: 7.5, bold: true, color: COLORS.white, align: "right" });
    doc.text(isEn ? "AMOUNT (IDR)" : "NOMINAL (IDR)", catCols.amount, y + 7, { size: 7.5, bold: true, color: COLORS.white, align: "right" });
    y += 22;
  };

  doc.text(
    isEn ? "1. Category Breakdown" : "1. Rincian per Kategori",
    MARGIN_X,
    y,
    { size: 11, bold: true, color: COLORS.textPrimary }
  );
  y += 18;
  drawCategoryTableHeader();

  if (catRows.length === 0) {
    doc.rect(MARGIN_X, y, CONTENT_W, 28, { fill: COLORS.zebra, stroke: COLORS.border, lineWidth: 0.5 });
    doc.text(
      isEn ? "No category records for this period." : "Belum ada rincian kategori pada periode ini.",
      MARGIN_X + CONTENT_W / 2,
      y + 10,
      { size: 8.5, color: COLORS.slateMuted, align: "center" }
    );
    y += 28;
  } else {
    const rowH = 24;
    catRows.forEach((row, index) => {
      if (y + rowH > FOOTER_LIMIT_Y) {
        addContinuationPage();
        drawCategoryTableHeader();
      }

      const isInc = row.type === "income";
      const pct = Math.min(Math.max(Number(row.percentage || 0), 0), 100);
      const swatchColor = row.color || (isInc ? COLORS.greenAccent : COLORS.redAccent);

      doc.rect(MARGIN_X, y, CONTENT_W, rowH, {
        fill: index % 2 === 1 ? COLORS.zebra : COLORS.white,
      });
      doc.line(MARGIN_X, y + rowH, PAGE_W - MARGIN_X, y + rowH, COLORS.border, 0.5);

      doc.text(String(index + 1), catCols.no, y + 8, { size: 8.2, color: COLORS.slateMuted });
      doc.pill(
        isInc ? (isEn ? "Income" : "Pemasukan") : isEn ? "Expense" : "Pengeluaran",
        catCols.type,
        y + 5,
        {
          bg: isInc ? COLORS.greenPillBg : COLORS.redPillBg,
          color: isInc ? COLORS.greenText : COLORS.redText,
          size: 7,
          padX: 6,
          height: 14,
        }
      );

      // Color swatch + nama kategori
      doc.rect(catCols.name, y + 8, 8, 8, { fill: swatchColor, radius: 2 });
      doc.text(row.name || "-", catCols.name + 13, y + 8, {
        size: 8.5,
        bold: true,
        color: COLORS.textPrimary,
        maxWidth: 118,
      });

      // Visual progress bar vektor
      doc.rect(catCols.bar, y + 9, catCols.barW, 6, { fill: COLORS.border, radius: 3 });
      const fillW = Math.max((pct / 100) * catCols.barW, pct > 0 ? 4 : 0);
      if (fillW > 0) {
        doc.rect(catCols.bar, y + 9, fillW, 6, { fill: swatchColor, radius: 3 });
      }

      doc.text(`${pct.toFixed(1)}%`, catCols.pct, y + 8, {
        size: 8.2,
        bold: true,
        color: COLORS.textSecondary,
        align: "right",
      });

      doc.text(formatSignedIDR(row.amount, row.type), catCols.amount, y + 8, {
        size: 8.5,
        bold: true,
        color: isInc ? COLORS.greenText : COLORS.redText,
        align: "right",
      });

      y += rowH;
    });
  }

  y += 22;

  // ---------- Tabel 2: Daftar Riwayat Transaksi Lengkap ----------
  if (y + 72 > FOOTER_LIMIT_Y) {
    addContinuationPage();
  }

  const txCols = {
    date: MARGIN_X + 8,
    type: MARGIN_X + 80,
    cat: MARGIN_X + 150,
    desc: MARGIN_X + 258,
    amount: PAGE_W - MARGIN_X - 8,
  };

  const drawTxTableHeader = () => {
    doc.rect(MARGIN_X, y, CONTENT_W, 22, { fill: COLORS.slateDark, radius: 4 });
    doc.text(isEn ? "DATE" : "TANGGAL", txCols.date, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "TYPE" : "TIPE", txCols.type, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "CATEGORY" : "KATEGORI", txCols.cat, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "DESCRIPTION" : "DESKRIPSI", txCols.desc, y + 7, { size: 7.5, bold: true, color: COLORS.white });
    doc.text(isEn ? "AMOUNT (IDR)" : "NOMINAL (IDR)", txCols.amount, y + 7, { size: 7.5, bold: true, color: COLORS.white, align: "right" });
    y += 22;
  };

  doc.text(
    isEn
      ? `2. Transaction History (${transactions.length})`
      : `2. Daftar Riwayat Transaksi (${transactions.length})`,
    MARGIN_X,
    y,
    { size: 11, bold: true, color: COLORS.textPrimary }
  );
  y += 18;
  drawTxTableHeader();

  if (transactions.length === 0) {
    doc.rect(MARGIN_X, y, CONTENT_W, 28, { fill: COLORS.zebra, stroke: COLORS.border, lineWidth: 0.5 });
    doc.text(
      isEn ? "No transactions recorded for this period." : "Tidak ada transaksi yang tercatat pada periode ini.",
      MARGIN_X + CONTENT_W / 2,
      y + 10,
      { size: 8.5, color: COLORS.slateMuted, align: "center" }
    );
    y += 28;
  } else {
    const rowH = 23;
    transactions.forEach((tx, index) => {
      if (y + rowH > FOOTER_LIMIT_Y) {
        addContinuationPage();
        drawTxTableHeader();
      }

      const isInc = tx.type === "income";
      const catColor = tx.category?.color || (isInc ? COLORS.greenAccent : COLORS.redAccent);

      doc.rect(MARGIN_X, y, CONTENT_W, rowH, {
        fill: index % 2 === 1 ? COLORS.zebra : COLORS.white,
      });
      doc.line(MARGIN_X, y + rowH, PAGE_W - MARGIN_X, y + rowH, COLORS.border, 0.5);

      doc.text(formatShortDate(tx.transactionDate, isEn), txCols.date, y + 7.5, {
        size: 8,
        color: COLORS.textSecondary,
      });

      doc.pill(
        isInc ? (isEn ? "Income" : "Pemasukan") : isEn ? "Expense" : "Pengeluaran",
        txCols.type,
        y + 4.5,
        {
          bg: isInc ? COLORS.greenPillBg : COLORS.redPillBg,
          color: isInc ? COLORS.greenText : COLORS.redText,
          size: 6.8,
          padX: 5.5,
          height: 13.5,
        }
      );

      // Titik warna kategori + nama
      doc.rect(txCols.cat, y + 8.5, 6, 6, { fill: catColor, radius: 3 });
      doc.text(tx.category?.name || "-", txCols.cat + 10, y + 7.5, {
        size: 8.2,
        color: COLORS.textPrimary,
        maxWidth: 92,
      });

      doc.text(tx.description || "-", txCols.desc, y + 7.5, {
        size: 8.2,
        color: COLORS.textSecondary,
        maxWidth: 164,
      });

      doc.text(formatSignedIDR(tx.amount, tx.type), txCols.amount, y + 7.5, {
        size: 8.4,
        bold: true,
        color: isInc ? COLORS.greenText : COLORS.redText,
        align: "right",
      });

      y += rowH;
    });
  }

  // Baris Total Selisih Bersih Periode
  if (y + 30 > FOOTER_LIMIT_Y) {
    addContinuationPage();
  }
  doc.rect(MARGIN_X, y + 4, CONTENT_W, 26, {
    fill: COLORS.navy,
    radius: 4,
  });
  doc.text(
    isEn ? "Net Cashflow for Selected Period" : "Total Selisih Bersih Periode",
    MARGIN_X + 12,
    y + 13,
    { size: 8.8, bold: true, color: COLORS.white }
  );
  doc.text(formatSignedIDR(difference), PAGE_W - MARGIN_X - 12, y + 13, {
    size: 9.5,
    bold: true,
    color: isSurplus ? "#34D399" : "#FCA5A5",
    align: "right",
  });

  // ---------- Stamp Footer Resmi di Setiap Halaman ----------
  const totalPages = doc.pages.length;
  for (let i = 0; i < totalPages; i += 1) {
    doc.current = doc.pages[i];
    const footerY = PAGE_H - 34;
    doc.line(MARGIN_X, footerY - 8, PAGE_W - MARGIN_X, footerY - 8, COLORS.border, 0.6);
    doc.text(
      isEn
        ? "FinManage  \u2022  Generated automatically from your account records (IDR)"
        : "FinManage  \u2022  Dokumen dihasilkan otomatis dari catatan akun Anda (IDR)",
      MARGIN_X,
      footerY,
      { size: 7.5, color: COLORS.slateMuted }
    );
    doc.text(
      isEn ? `Page ${i + 1} of ${totalPages}` : `Halaman ${i + 1} dari ${totalPages}`,
      PAGE_W - MARGIN_X,
      footerY,
      { size: 7.5, bold: true, color: COLORS.textSecondary, align: "right" }
    );
  }

  return doc.buildBlob();
}