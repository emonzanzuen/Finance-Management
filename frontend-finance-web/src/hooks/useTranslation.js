import { useApp } from "../context/AppContext";
import id from "../locales/id.json";
import en from "../locales/en.json";

// Kumpulkan semua terjemahan dalam satu objek
const translations = {
  id,
  en,
};

/**
 * Custom hook untuk mengakses fungsi translasi
 * @returns {Object} { t: function, language: string, setLanguage: function }
 */
export const useTranslation = () => {
  const { language, setLanguage } = useApp();

  /**
   * Menerjemahkan key menjadi teks sesuai bahasa yang dipilih
   * @param {string} key - Key terjemahan (contoh: "dashboard.title")
   * @param {Object} params - Parameter untuk interpolasi (opsional)
   * @returns {string} - Teks terjemahan
   */
  const t = (key, params = {}) => {
    // Jika key kosong atau bukan string
    if (!key || typeof key !== 'string') return key;

    // Pecah key berdasarkan titik (.)
    const keys = key.split('.');
    const langData = translations[language] || translations.id;
    let result = langData;

    // Navigasi objek berdasarkan keys
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        console.warn(`🔍 Translation key "${key}" not found for language "${language}"`);
        return key;
      }
    }

    // Jika hasilnya bukan string, return key
    if (typeof result !== 'string') {
      console.warn(`🔍 Translation for "${key}" is not a string`);
      return key;
    }

    // Interpolasi: ganti placeholder {key} dengan nilai dari params
    let translated = result;
    for (const [k, v] of Object.entries(params)) {
      translated = translated.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }

    return translated;
  };

  return { t, language, setLanguage };
};