import React from "react";
import { TrendingUp } from "lucide-react";

/** Kerangka halaman Login dan Register (mempertahankan tampilan lama). */
const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
    </div>
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">FinManage</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{subtitle}</p>}
      </div>
      <div className="bg-white dark:bg-gray-900/90 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-800/20 border border-gray-200/60 dark:border-gray-800/60 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">{title}</h2>
        {children}
      </div>
      {footer}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
        &copy; {new Date().getFullYear()} FinManage
      </p>
    </div>
  </div>
);

export default AuthShell;
