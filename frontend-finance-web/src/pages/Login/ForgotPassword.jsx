import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import { authService } from "../../api/services/auth.js";
import { apiMessage } from "../../lib/apiMessage";

export default function ForgotPassword() {
  const navigate = useNavigate(); const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(""); try { await authService.forgotPassword({ email: email.trim().toLowerCase() }); navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`); } catch (err) { setError(apiMessage((k) => k, err)); } finally { setBusy(false); } };
  return <AuthShell title="Lupa kata sandi" subtitle="Kami akan mengirim kode OTP jika alamat email terdaftar." footer={<p className="mt-6 text-center text-sm text-gray-500"><Link className="text-primary-600" to="/login">Kembali ke login</Link></p>}><form className="space-y-4" onSubmit={submit}>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm">Email<input className="input mt-1" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label><button className="btn btn-primary w-full" disabled={busy}>{busy ? "Mengirim…" : "Kirim kode OTP"}</button></form></AuthShell>;
}
