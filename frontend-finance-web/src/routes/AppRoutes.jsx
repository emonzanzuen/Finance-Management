import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Transactions from "../pages/Transactions/Transactions";
import Categories from "../pages/Categories/Categories";
import Budget from "../pages/Budget/Budget";
import SavingsGoals from "../pages/SavingsGoals/SavingsGoals";
import Reports from "../pages/Reports/Reports";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Notifications from "../pages/Notifications/Notifications";
import ImportTransactions from "../pages/Imports/ImportTransactions";
import ScanReceipt from "../pages/Transactions/ScanReceipt";
import ForgotPassword from "../pages/Login/ForgotPassword";
import ResetPassword from "../pages/Login/ResetPassword";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />} />
      <Route
        path="/"
        element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budget" element={<Budget />} />
        <Route path="savings" element={<SavingsGoals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="imports" element={<ImportTransactions />} />
        <Route path="scan-receipt" element={<ScanReceipt />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
