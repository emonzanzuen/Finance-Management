import { z } from "zod";

// Schema untuk validasi transaksi
export const transactionSchema = z.object({
  date: z.string().min(1, "Tanggal harus diisi"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipe transaksi harus dipilih",
  }),
  category: z.string().min(1, "Kategori harus dipilih"),
  amount: z.number()
    .min(1, "Jumlah harus lebih dari 0")
    .max(999999999, "Jumlah terlalu besar"),
  description: z.string()
    .min(1, "Deskripsi harus diisi")
    .max(100, "Deskripsi maksimal 100 karakter"),
});

// Schema untuk validasi kategori
export const categorySchema = z.object({
  name: z.string()
    .min(1, "Nama kategori harus diisi")
    .max(30, "Nama kategori maksimal 30 karakter"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipe kategori harus dipilih",
  }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna tidak valid"),
});

// Schema untuk validasi budget
export const budgetSchema = z.object({
  month: z.number().min(0).max(11),
  year: z.number().min(2020).max(2030),
  categories: z.array(
    z.object({
      category: z.string().min(1, "Nama kategori harus diisi"),
      budgetAmount: z.number().min(0, "Budget harus lebih dari 0"),
      spentAmount: z.number().min(0),
    })
  ),
});

// Schema untuk validasi savings goal
export const goalSchema = z.object({
  title: z.string()
    .min(1, "Judul target harus diisi")
    .max(50, "Judul maksimal 50 karakter"),
  targetAmount: z.number()
    .min(1, "Target harus lebih dari 0")
    .max(999999999, "Target terlalu besar"),
  deadline: z.string().optional(),
  currentAmount: z.number().min(0).default(0),
});

// Schema untuk validasi profil user
export const profileSchema = z.object({
  name: z.string()
    .min(1, "Nama harus diisi")
    .max(50, "Nama maksimal 50 karakter"),
  email: z.string()
    .email("Format email tidak valid")
    .min(1, "Email harus diisi"),
  avatar: z.string().url("Format URL avatar tidak valid").optional(),
});

// Schema untuk validasi login
export const loginSchema = z.object({
  email: z.string()
    .email("Format email tidak valid")
    .min(1, "Email harus diisi"),
  password: z.string()
    .min(6, "Password minimal 6 karakter")
    .max(50, "Password maksimal 50 karakter"),
  rememberMe: z.boolean().default(false),
});

// Validasi partial (untuk update)
export const partialTransactionSchema = transactionSchema.partial();
export const partialCategorySchema = categorySchema.partial();
export const partialGoalSchema = goalSchema.partial();
export const partialProfileSchema = profileSchema.partial();

// Helper function untuk validasi form
export const validateForm = (schema, data) => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, curr) => {
        const path = curr.path.join(".");
        acc[path] = curr.message;
        return acc;
      }, {});
      return { success: false, data: null, errors };
    }
    return { success: false, data: null, errors: { general: error.message } };
  }
};

// Helper untuk field validation
export const validateField = (schema, field, value) => {
  try {
    const result = schema.shape[field].parse(value);
    return { success: true, value: result, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, value: null, error: error.errors[0].message };
    }
    return { success: false, value: null, error: error.message };
  }
};

// Error messages yang sudah terdefinisi
export const ERROR_MESSAGES = {
  REQUIRED: "Field ini harus diisi",
  INVALID_EMAIL: "Format email tidak valid",
  INVALID_PHONE: "Format nomor telepon tidak valid",
  MIN_AMOUNT: "Jumlah minimal adalah {min}",
  MAX_AMOUNT: "Jumlah maksimal adalah {max}",
  MIN_LENGTH: "Minimal {min} karakter",
  MAX_LENGTH: "Maksimal {max} karakter",
  INVALID_DATE: "Format tanggal tidak valid",
  INVALID_SELECTION: "Pilihan tidak valid",
  PASSWORDS_DONT_MATCH: "Password tidak cocok",
};