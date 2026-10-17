import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Transactions from "./pages/Transactions/Transactions";
import Categories from "./pages/Categories/Categories";
import Budget from "./pages/Budget/Budget";
import SavingsGoals from "./pages/SavingsGoals/SavingsGoals";
import Reports from "./pages/Reports/Reports";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import { useTranslation } from "./hooks/useTranslation";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  // useTranslation tidak perlu dipanggil di sini, hanya di komponen yang butuh

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budget" element={<Budget />} />
        <Route path="savings" element={<SavingsGoals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;