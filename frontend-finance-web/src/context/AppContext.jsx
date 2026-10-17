import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { initialTransactions, initialCategories, initialBudget, initialGoals } from "../data/initialData";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/formatters";

// ============================================================
//   KONSTANTA
// ============================================================
const FALLBACK_RATES = { IDR: 1, USD: 16500, EUR: 20600 };
const SUPPORTED_CURRENCIES = ["USD", "EUR"];
const RATES_API_URL = "https://open.er-api.com/v6/latest/IDR";
const RATE_CACHE_TTL = 60 * 60 * 1000;
const RATE_REFRESH_INTERVAL = 30 * 60 * 1000;

// Backup keys
const BACKUP_KEY = 'finmanage_backup';
const BACKUP_METADATA_KEY = 'finmanage_backup_metadata';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

// ===== FORMAT CURRENCY DENGAN KURS =====
const formatCurrencyWithRate = (amount, currency, rates) => {
  if (!amount || isNaN(amount) || amount === 0) return formatCurrency(0, currency);
  const safeRates = rates || FALLBACK_RATES;
  const rate = safeRates[currency] || 1;
  const converted = currency === "IDR" ? amount : amount / rate;
  return formatCurrency(converted, currency);
};

export const AppProvider = ({ children }) => {
  // ===== STATE =====
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("transactions");
      return saved ? JSON.parse(saved) : initialTransactions;
    } catch { return initialTransactions; }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("categories");
      return saved ? JSON.parse(saved) : initialCategories;
    } catch { return initialCategories; }
  });

  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem("budget");
      return saved ? JSON.parse(saved) : initialBudget;
    } catch { return initialBudget; }
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("goals");
      return saved ? JSON.parse(saved) : initialGoals;
    } catch { return initialGoals; }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff",
      };
    } catch {
      return {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff",
      };
    }
  });

  const [notifications, setNotifications] = useState([]);

  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem("currency") || "IDR"; }
    catch { return "IDR"; }
  });

  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("language") || "id"; }
    catch { return "id"; }
  });

  // ===== EXCHANGE RATES =====
  const [exchangeRates, setExchangeRates] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("exchangeRatesCache") || "null");
      return cached?.rates || FALLBACK_RATES;
    } catch { return FALLBACK_RATES; }
  });
  const [ratesLastUpdated, setRatesLastUpdated] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("exchangeRatesCache") || "null");
      return cached?.timestamp || null;
    } catch { return null; }
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const [ratesSource, setRatesSource] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("exchangeRatesCache") || "null");
      return cached ? "live" : "fallback";
    } catch { return "fallback"; }
  });

  const refreshInFlight = useRef(false);

  // ===== FETCH REAL-TIME RATES =====
  const fetchExchangeRates = useCallback(async ({ silent = false, force = false } = {}) => {
    if (refreshInFlight.current) return;

    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem("exchangeRatesCache") || "null");
        if (cached?.timestamp && Date.now() - cached.timestamp < RATE_CACHE_TTL) {
          setExchangeRates(cached.rates);
          setRatesLastUpdated(cached.timestamp);
          setRatesSource("live");
          return;
        }
      } catch {}
    }

    refreshInFlight.current = true;
    if (!silent) setIsLoadingRates(true);
    setRatesError(null);

    try {
      const response = await fetch(RATES_API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.result !== "success" || !data.rates) {
        throw new Error("Format respons API tidak valid");
      }

      const newRates = { IDR: 1 };
      SUPPORTED_CURRENCIES.forEach((code) => {
        const rateFromIDR = data.rates[code];
        if (rateFromIDR && rateFromIDR > 0) {
          newRates[code] = 1 / rateFromIDR;
        } else {
          newRates[code] = FALLBACK_RATES[code];
        }
      });

      const timestamp = Date.now();
      setExchangeRates(newRates);
      setRatesLastUpdated(timestamp);
      setRatesSource("live");
      localStorage.setItem(
        "exchangeRatesCache",
        JSON.stringify({ rates: newRates, timestamp })
      );

      if (!silent) toast.success("Kurs berhasil diperbarui");
    } catch (err) {
      console.error("Gagal mengambil kurs real-time:", err);
      setRatesError(err.message || "Gagal mengambil kurs");
      setRatesSource("fallback");
      setExchangeRates((prev) => prev || FALLBACK_RATES);
      if (!silent) toast.error("Gagal memperbarui kurs, memakai kurs cadangan");
    } finally {
      setIsLoadingRates(false);
      refreshInFlight.current = false;
    }
  }, []);

  // Fetch saat mount
  useEffect(() => {
    fetchExchangeRates({ silent: true });
  }, [fetchExchangeRates]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExchangeRates({ silent: true });
    }, RATE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  const refreshRates = () => fetchExchangeRates({ silent: false, force: true });

  // ===== SAVE TO LOCALSTORAGE =====
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("budget", JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // ===== NOTIFICATIONS =====
  const addNotification = (message, type = "info") => {
    const newNotif = {
      id: Date.now(),
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else if (type === "warning") toast(message, { icon: "⚠️" });
    else toast(message);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ===== CONVERT CURRENCY =====
  const convertCurrency = (amountInIDR, targetCurrency) => {
    if (!amountInIDR || isNaN(amountInIDR)) return 0;
    if (targetCurrency === 'IDR') return amountInIDR;
    const rate = exchangeRates[targetCurrency];
    if (!rate || rate === 0) return amountInIDR;
    return amountInIDR / rate;
  };

  // ===== EXISTING FUNCTIONS =====
  const getTotalIncome = () => {
    return transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  const getRecentTransactions = (limit = 5) => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
  };

  const getTransactionsByMonth = (month, year) => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  // ===== CRUD =====
  const addTransaction = (transaction) => {
    const newTransaction = { ...transaction, id: Date.now() };
    setTransactions([newTransaction, ...transactions]);
    addNotification(
      `Transaksi baru: ${transaction.description} - ${formatCurrencyWithRate(transaction.amount, currency, exchangeRates)}`,
      "success"
    );
  };

  const editTransaction = (id, updatedData) => {
    setTransactions(transactions.map((t) => (t.id === id ? { ...t, ...updatedData } : t)));
    addNotification(`Transaksi diperbarui: ${updatedData.description}`, "info");
  };

  const deleteTransaction = (id) => {
    const deleted = transactions.find(t => t.id === id);
    setTransactions(transactions.filter((t) => t.id !== id));
    if (deleted) addNotification(`Transaksi dihapus: ${deleted.description}`, "warning");
  };

  const addCategory = (category) => {
    const newCategory = { ...category, id: Date.now() };
    setCategories(prev => ({
      ...prev,
      [category.type]: [...prev[category.type], newCategory],
    }));
    addNotification(`Kategori ditambahkan: ${category.name}`, "success");
  };

  const editCategory = (id, updatedData) => {
    let oldType = null;
    let oldCategory = null;
    const incomeIndex = categories.income.findIndex(c => c.id === id);
    if (incomeIndex !== -1) {
      oldType = 'income';
      oldCategory = categories.income[incomeIndex];
    } else {
      const expenseIndex = categories.expense.findIndex(c => c.id === id);
      if (expenseIndex !== -1) {
        oldType = 'expense';
        oldCategory = categories.expense[expenseIndex];
      }
    }
    if (!oldCategory) {
      toast.error('Kategori tidak ditemukan');
      return;
    }
    const newCategory = { ...oldCategory, ...updatedData };
    const newType = newCategory.type;
    if (oldType !== newType) {
      const updatedCategories = { ...categories };
      updatedCategories[oldType] = updatedCategories[oldType].filter(c => c.id !== id);
      updatedCategories[newType] = [...updatedCategories[newType], newCategory];
      setCategories(updatedCategories);
      addNotification(`Kategori dipindahkan: ${newCategory.name} (${newType})`, "info");
    } else {
      setCategories(prev => {
        const updated = { ...prev };
        updated[oldType] = updated[oldType].map(c => c.id === id ? newCategory : c);
        return updated;
      });
      addNotification(`Kategori diperbarui: ${newCategory.name}`, "info");
    }
  };

  const deleteCategory = (id) => {
    const updatedCategories = { ...categories };
    let found = false;
    let deletedName = "";
    ['income', 'expense'].forEach(type => {
      if (!found) {
        const index = updatedCategories[type].findIndex(c => c.id === id);
        if (index !== -1) {
          deletedName = updatedCategories[type][index].name;
          updatedCategories[type].splice(index, 1);
          found = true;
        }
      }
    });
    if (found) {
      setCategories(updatedCategories);
      addNotification(`Kategori dihapus: ${deletedName}`, "warning");
    } else {
      toast.error("Kategori tidak ditemukan");
    }
  };

  const updateBudget = (newBudget) => {
    setBudget(newBudget);
    addNotification("Budget bulanan diperbarui", "info");
  };

  const addGoal = (goal) => {
    const newGoal = { ...goal, id: Date.now(), currentAmount: 0 };
    setGoals([...goals, newGoal]);
    addNotification(`Target tabungan baru: ${goal.title}`, "success");
  };

  const editGoal = (id, updatedData) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...updatedData } : g));
    addNotification(`Target tabungan diperbarui: ${updatedData.title}`, "info");
  };

  const deleteGoal = (id) => {
    const deleted = goals.find(g => g.id === id);
    setGoals(goals.filter(g => g.id !== id));
    if (deleted) addNotification(`Target tabungan dihapus: ${deleted.title}`, "warning");
  };

  const updateGoalProgress = (id, amount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    setGoals(goals.map(g =>
      g.id === id ? { ...g, currentAmount: newAmount } : g
    ));
    if (newAmount >= goal.targetAmount) {
      addNotification(`🎉 Target "${goal.title}" tercapai!`, "success");
    } else {
      addNotification(`Tabungan ditambahkan ke "${goal.title}"`, "info");
    }
  };

  const updateUser = (data) => {
    setUser({ ...user, ...data });
    localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
    addNotification("Profil diperbarui", "info");
  };

  // ============================================================
  //   BACKUP & RESTORE
  // ============================================================

  const createBackup = () => {
    try {
      const backupData = {
        transactions,
        categories,
        budget,
        goals,
        user,
        currency,
        language,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));

      // Metadata backup
      const metadata = JSON.parse(localStorage.getItem(BACKUP_METADATA_KEY) || '[]');
      metadata.push({
        timestamp: backupData.timestamp,
        transactionsCount: transactions.length,
        goalsCount: goals.length,
      });
      if (metadata.length > 10) metadata.shift();
      localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata));

      toast.success(`Backup berhasil dibuat (${new Date(backupData.timestamp).toLocaleString()})`);
      return true;
    } catch (error) {
      console.error('Gagal membuat backup:', error);
      toast.error('Gagal membuat backup');
      return false;
    }
  };

  const restoreBackup = () => {
    try {
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (!backupRaw) {
        toast.error('Tidak ada backup yang tersedia');
        return false;
      }

      const backupData = JSON.parse(backupRaw);
      if (!backupData.transactions || !backupData.categories) {
        toast.error('Backup tidak valid atau rusak');
        return false;
      }

      // Update state
      setTransactions(backupData.transactions);
      setCategories(backupData.categories);
      setBudget(backupData.budget || initialBudget);
      setGoals(backupData.goals || initialGoals);
      if (backupData.user) setUser(backupData.user);
      if (backupData.currency) setCurrency(backupData.currency);
      if (backupData.language) setLanguage(backupData.language);

      // Simpan ke localStorage
      localStorage.setItem('transactions', JSON.stringify(backupData.transactions));
      localStorage.setItem('categories', JSON.stringify(backupData.categories));
      localStorage.setItem('budget', JSON.stringify(backupData.budget || initialBudget));
      localStorage.setItem('goals', JSON.stringify(backupData.goals || initialGoals));
      if (backupData.user) localStorage.setItem('user', JSON.stringify(backupData.user));
      if (backupData.currency) localStorage.setItem('currency', backupData.currency);
      if (backupData.language) localStorage.setItem('language', backupData.language);

      toast.success(`Data berhasil dipulihkan dari backup (${new Date(backupData.timestamp).toLocaleString()})`);
      return true;
    } catch (error) {
      console.error('Gagal restore backup:', error);
      toast.error('Gagal memulihkan backup');
      return false;
    }
  };

  const resetDataWithBackup = () => {
    createBackup(); // backup otomatis
    localStorage.removeItem('transactions');
    localStorage.removeItem('categories');
    localStorage.removeItem('budget');
    localStorage.removeItem('goals');
    setTransactions(initialTransactions);
    setCategories(initialCategories);
    setBudget(initialBudget);
    setGoals(initialGoals);
    toast.success('Data telah direset ke default. Backup tersedia jika diperlukan.');
  };

  const hasBackup = () => !!localStorage.getItem(BACKUP_KEY);

  const getBackupList = () => {
    try {
      return JSON.parse(localStorage.getItem(BACKUP_METADATA_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const clearBackups = () => {
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_METADATA_KEY);
    toast.success('Semua backup telah dihapus');
  };

  // ============================================================

  return (
    <AppContext.Provider
      value={{
        transactions,
        categories,
        budget,
        goals,
        user,
        notifications,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        unreadCount,
        currency,
        setCurrency,
        language,
        setLanguage,
        exchangeRates,
        ratesLastUpdated,
        isLoadingRates,
        ratesError,
        ratesSource,
        refreshRates,
        createBackup,
        restoreBackup,
        hasBackup,
        getBackupList,
        clearBackups,
        resetDataWithBackup,
        convertCurrency,
        getTotalIncome,
        getTotalExpense,
        getBalance,
        getRecentTransactions,
        getTransactionsByMonth,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addCategory,
        editCategory,
        deleteCategory,
        updateBudget,
        addGoal,
        editGoal,
        deleteGoal,
        updateGoalProgress,
        updateUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};