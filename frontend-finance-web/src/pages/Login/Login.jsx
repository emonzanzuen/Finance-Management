import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@finmanage.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (email === "demo@finmanage.com" && password === "demo123") {
        login();
        toast.success("Selamat datang kembali!");
        navigate("/", { replace: true });
      } else {
        toast.error("Email atau password salah!");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow duration-300">
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">
            FinManage
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Kelola keuangan pribadi dengan mudah dan cerdas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-800/20 border border-gray-200/60 dark:border-gray-800/60 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
            Masuk ke Akun
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kata Sandi
                </label>
                <button type="button" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors font-medium">
                  Lupa sandi?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </div>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wider">
              Akun Demo
            </p>
            <div className="flex flex-col items-center gap-1 mt-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 dark:text-gray-500">Email:</span>
                <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-primary-600 dark:text-primary-400">
                  demo@finmanage.com
                </code>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 dark:text-gray-500">Password:</span>
                <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-primary-600 dark:text-primary-400">
                  demo123
                </code>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} FinManage — Personal Finance Management
        </p>
      </div>
    </div>
  );
};

export default Login;