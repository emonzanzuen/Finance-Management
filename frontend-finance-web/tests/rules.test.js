import { describe, expect, it } from "vitest";
import { formatAmountInput, isValidDate, parseAmountInput, todayWIB, validatePassword } from "../src/lib/rules.js";
import { fieldErrors, normalizeError, ApiError } from "../src/api/errors.js";
import { registerSchema, transactionSchema, categorySchema } from "../src/lib/schemas.js";
import { formatApiDate } from "../src/lib/format.js";

describe("validatePassword", () => {
  it("menolak password pendek, tanpa angka, tanpa huruf, atau sama dengan email", () => {
    expect(validatePassword("abc123")).toMatch(/minimal 8/);
    expect(validatePassword("abcdefgh")).toMatch(/huruf dan angka/);
    expect(validatePassword("12345678")).toMatch(/huruf dan angka/);
    expect(validatePassword("budi1234", "BUDI1234")).toMatch(/sama dengan email/);
    expect(validatePassword("a".repeat(129) + "1")).toMatch(/maksimal 128/);
  });
  it("menerima password yang valid", () => {
    expect(validatePassword("Rahasia123", "budi@example.com")).toBeNull();
  });
});

describe("tanggal dan nominal", () => {
  it("isValidDate menolak tanggal yang tidak ada di kalender", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-10-16")).toBe(true);
    expect(isValidDate("16/10/2026")).toBe(false);
  });
  it("todayWIB memakai zona Asia/Jakarta", () => {
    expect(todayWIB(new Date("2026-10-21T20:00:00Z"))).toBe("2026-10-22");
    expect(todayWIB(new Date("2026-10-21T10:00:00Z"))).toBe("2026-10-21");
  });
  it("parse dan format input nominal", () => {
    expect(parseAmountInput("1.500.000")).toBe(1500000);
    expect(parseAmountInput("Rp 45.000")).toBe(45000);
    expect(Number.isNaN(parseAmountInput(""))).toBe(true);
    expect(formatAmountInput("1500000")).toBe("1.500.000");
    expect(formatAmountInput("abc")).toBe("");
  });
  it("formatApiDate tidak bergeser hari", () => {
    expect(formatApiDate("2026-10-01", "en")).toMatch(/Oct 01, 2026/);
    expect(formatApiDate("", "id")).toBe("");
  });
});

describe("schema form", () => {
  it("registerSchema memeriksa kebijakan password dan konfirmasi", () => {
    const base = { name: "Budi", email: "budi@example.com", password: "Rahasia123", confirmPassword: "Rahasia123" };
    expect(registerSchema.safeParse(base).success).toBe(true);
    const bad = registerSchema.safeParse({ ...base, confirmPassword: "beda" });
    expect(bad.success).toBe(false);
    expect(bad.error.issues.some((i) => i.path[0] === "confirmPassword")).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "abc", confirmPassword: "abc" }).success).toBe(false);
  });
  it("transactionSchema menolak nominal 0, tanggal masa depan, dan tanggal tidak valid", () => {
    const base = { type: "expense", categoryId: "c1", amount: "45.000", transactionDate: "2026-10-16", description: "" };
    expect(transactionSchema.safeParse(base).success).toBe(true);
    expect(transactionSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, amount: "" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, transactionDate: "2999-01-01" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, transactionDate: "2026-02-30" }).success).toBe(false);
  });
  it("categorySchema memvalidasi warna dan nama", () => {
    expect(categorySchema.safeParse({ name: "Kopi", type: "expense", color: "#ff0000" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: " ", type: "expense", color: "#ff0000" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "Kopi", type: "expense", color: "red" }).success).toBe(false);
  });
});

describe("error API", () => {
  it("normalizeError membaca bentuk error kontrak", () => {
    const e = normalizeError({ response: { status: 409, data: { error: { code: "CATEGORY_IN_USE", message: "x", details: { transactionCount: 2, budgetCount: 1 } } } } });
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe("CATEGORY_IN_USE");
    expect(e.details.transactionCount).toBe(2);
  });
  it("normalizeError mengenali kegagalan jaringan", () => {
    expect(normalizeError({ code: "ERR_NETWORK", request: {} }).code).toBe("NETWORK_ERROR");
  });
  it("fieldErrors mendukung array dan objek", () => {
    expect(fieldErrors({ details: [{ path: "amount", message: "salah" }] })).toEqual({ amount: "salah" });
    expect(fieldErrors({ details: { fields: { name: "wajib" } } })).toEqual({ name: "wajib" });
    expect(fieldErrors({})).toEqual({});
  });
});
