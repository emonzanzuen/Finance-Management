import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import { authService } from "../../api/services/auth.js";
import { apiMessage } from "../../lib/apiMessage";

export default function ResetPassword() {
  const navigate = useNavigate(); const [params] = useSearchParams(); const [form, setForm] = useState({ email: params.get("email") || "", code: "", newPassword: "" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(""); try { await authService.resetPassword({ ...form, email: form.email.trim().toLowerCase() }); navigate("/login", { replace: true, state: { message: "Kata sandi diubah. Silakan masuk kembali." } }); } catch (err) { setError(apiMessage((k) => k, err)); } finally { setBusy(false); } };
  return <AuthShell title="Atur ulang kata sandi" subtitle="Masukkan OTP yang dikirim ke email Anda." footer={<p className="mt-6 text-center text-sm text-gray-500"><Link className="text-primary-600" to="/login">Kembali ke login</Link></p>}><form className="space-y-4" onSubmit={submit}>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm">Email<input className="input mt-1" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label><label className="block text-sm">Kode OTP<input className="input mt-1" required inputMode="numeric" pattern="[0-9]{6}" minLength="6" maxLength="6" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "") })}/></label><label className="block text-sm">Kata sandi baru<input className="input mt-1" type="password" required minLength="8" maxLength="128" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}/></label><button className="btn btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : "Atur ulang kata sandi"}</button></form></AuthShell>;
}
