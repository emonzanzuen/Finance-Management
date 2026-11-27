import { z } from "zod";
import { AMOUNT_MAX, isValidDate, todayWIB, validatePassword } from "./rules.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").regex(EMAIL_RE, "Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
    email: z.string().trim().min(1, "Email wajib diisi.").max(255).regex(EMAIL_RE, "Email tidak valid."),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    const msg = validatePassword(v.password, v.email);
    if (msg) ctx.addIssue({ code: "custom", path: ["password"], message: msg });
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Konfirmasi password tidak sama." });
    }
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(50, "Nama maksimal 50 karakter."),
  type: z.enum(["income", "expense"], { error: "Pilih tipe kategori." }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus berformat #RRGGBB."),
});

/** amount berupa string input (boleh memuat pemisah ribuan); dikonversi di form. */
export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense"], { error: "Pilih tipe transaksi." }),
    categoryId: z.string().min(1, "Pilih kategori."),
    amount: z.string().min(1, "Nominal wajib diisi."),
    transactionDate: z.string().min(1, "Tanggal wajib diisi."),
    description: z.string().trim().max(255, "Deskripsi maksimal 255 karakter.").optional(),
  })
  .superRefine((v, ctx) => {
    const digits = v.amount.replace(/[^\d]/g, "");
    const n = digits === "" ? NaN : Number(digits);
    if (Number.isNaN(n) || n < 1) ctx.addIssue({ code: "custom", path: ["amount"], message: "Nominal harus lebih dari 0." });
    else if (n > AMOUNT_MAX) ctx.addIssue({ code: "custom", path: ["amount"], message: "Nominal terlalu besar." });
    if (!isValidDate(v.transactionDate)) {
      ctx.addIssue({ code: "custom", path: ["transactionDate"], message: "Tanggal tidak valid." });
    } else if (v.transactionDate > todayWIB()) {
      ctx.addIssue({ code: "custom", path: ["transactionDate"], message: "Tanggal tidak boleh melewati hari ini." });
    }
  });
