export const initialTransactions = [
  {
    id: 1,
    date: "2026-08-01",
    type: "income",
    category: "Salary",
    amount: 15000000,
    description: "Gaji bulan Agustus",
  },
  {
    id: 2,
    date: "2026-08-02",
    type: "expense",
    category: "Food",
    amount: 75000,
    description: "Makan siang di restoran",
  },
  {
    id: 3,
    date: "2026-08-03",
    type: "expense",
    category: "Transportation",
    amount: 30000,
    description: "Gojek ke kantor",
  },
  {
    id: 4,
    date: "2026-08-04",
    type: "income",
    category: "Freelance",
    amount: 2500000,
    description: "Project website",
  },
  {
    id: 5,
    date: "2026-08-05",
    type: "expense",
    category: "Shopping",
    amount: 500000,
    description: "Beli baju baru",
  },
];

export const initialCategories = {
  income: [
    { id: "inc-1", name: "Salary", icon: "Briefcase", color: "#22c55e" },
    { id: "inc-2", name: "Freelance", icon: "Laptop", color: "#3b82f6" },
    { id: "inc-3", name: "Bonus", icon: "Gift", color: "#eab308" },
    { id: "inc-4", name: "Investment", icon: "TrendingUp", color: "#8b5cf6" },
    { id: "inc-5", name: "Other", icon: "MoreHorizontal", color: "#6b7280" },
  ],
  expense: [
    { id: "exp-1", name: "Food", icon: "Utensils", color: "#ef4444" },
    { id: "exp-2", name: "Transportation", icon: "Car", color: "#f59e0b" },
    { id: "exp-3", name: "Shopping", icon: "ShoppingBag", color: "#ec4899" },
    { id: "exp-4", name: "Bills", icon: "FileText", color: "#3b82f6" },
    { id: "exp-5", name: "Entertainment", icon: "Film", color: "#8b5cf6" },
    { id: "exp-6", name: "Education", icon: "BookOpen", color: "#14b8a6" },
    { id: "exp-7", name: "Health", icon: "Heart", color: "#22c55e" },
    { id: "exp-8", name: "Other", icon: "MoreHorizontal", color: "#6b7280" },
  ],
};

export const initialBudget = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  categories: [
    { category: "Food", budgetAmount: 3000000, spentAmount: 75000 },
    { category: "Transportation", budgetAmount: 1000000, spentAmount: 30000 },
    { category: "Shopping", budgetAmount: 2000000, spentAmount: 500000 },
    { category: "Bills", budgetAmount: 1500000, spentAmount: 0 },
    { category: "Entertainment", budgetAmount: 1000000, spentAmount: 0 },
    { category: "Education", budgetAmount: 1000000, spentAmount: 0 },
    { category: "Health", budgetAmount: 500000, spentAmount: 0 },
    { category: "Other", budgetAmount: 500000, spentAmount: 0 },
  ],
};

export const initialGoals = [
  {
    id: 1,
    title: "Liburan ke Bali",
    targetAmount: 10000000,
    currentAmount: 2500000,
    deadline: "2026-12-31",
  },
  {
    id: 2,
    title: "Laptop Baru",
    targetAmount: 15000000,
    currentAmount: 5000000,
    deadline: "2026-10-15",
  },
];