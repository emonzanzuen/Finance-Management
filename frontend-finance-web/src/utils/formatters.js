// utils/formatters.js

// ============================================================
//   FORMAT CURRENCY (DENGAN DUKUNGAN CURRENCY DINAMIS)
// ============================================================

/**
 * Format angka menjadi mata uang dengan dukungan berbagai mata uang
 * @param {number} amount - Jumlah yang akan diformat
 * @param {string} currencyCode - Kode mata uang (IDR, USD, EUR) - default 'IDR'
 * @returns {string} - Mata uang yang sudah diformat
 */
export const formatCurrency = (amount, currencyCode = 'IDR') => {
  // Jika amount tidak valid, return 0
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }

  // Konfigurasi untuk setiap mata uang
  const config = {
    'IDR': { locale: 'id-ID', currency: 'IDR', minFraction: 0 },
    'USD': { locale: 'en-US', currency: 'USD', minFraction: 2 },
    'EUR': { locale: 'de-DE', currency: 'EUR', minFraction: 2 },
  };

  const { locale, currency, minFraction } = config[currencyCode] || config['IDR'];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minFraction,
    maximumFractionDigits: minFraction,
  }).format(amount);
};

// ============================================================
//   FORMAT CURRENCY DENGAN KONVERSI (KURS)
// ============================================================

/**
 * Format mata uang dengan konversi berdasarkan kurs
 * @param {number} amountInIDR - Jumlah dalam IDR
 * @param {string} targetCurrency - Kode mata uang tujuan (IDR, USD, EUR)
 * @param {Object} rates - Objek kurs { IDR: 1, USD: 16500, EUR: 20600 }
 * @returns {string} - Mata uang yang sudah diformat dan dikonversi
 */
export const formatCurrencyWithRate = (amountInIDR, targetCurrency = 'IDR', rates = {}) => {
  if (!amountInIDR || isNaN(amountInIDR)) return formatCurrency(0, targetCurrency);
  
  // Ambil kurs untuk mata uang tujuan
  const rate = rates[targetCurrency] || 1;
  let convertedAmount = amountInIDR;
  
  // Konversi jika bukan IDR
  if (targetCurrency !== 'IDR') {
    convertedAmount = amountInIDR / rate;
  }

  return formatCurrency(convertedAmount, targetCurrency);
};

// ============================================================
//   FORMAT TANGGAL
// ============================================================

/**
 * Format tanggal ke format Indonesia (contoh: 1 Januari 2025)
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format tanggal pendek (contoh: 1 Jan 2025)
 */
export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
//   FUNGSI BANTUAN BULAN & HARI
// ============================================================

/**
 * Mendapatkan nama bulan dalam bahasa Indonesia
 * @param {number} month - Index bulan (0-11)
 * @returns {string} - Nama bulan
 */
export const getMonthName = (month) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[month] || "Unknown";
};

/**
 * Mendapatkan nama hari dalam bahasa Indonesia
 * @param {Date|string} date - Tanggal
 * @returns {string} - Nama hari
 */
export const getDayName = (date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const d = new Date(date);
  return days[d.getDay()] || "Unknown";
};