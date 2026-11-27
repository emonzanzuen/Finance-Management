// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, cat } from "./helpers.jsx";
import { ApiError } from "../src/api/errors.js";

vi.mock("../src/api/services/categories.js", () => ({
  categoryService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
import { categoryService } from "../src/api/services/categories.js";
import Categories from "../src/pages/Categories/Categories.jsx";

const cats = [
  cat("c1", "Salary", "income"), cat("c2", "Bonus", "income", "#eab308"),
  cat("c3", "Food", "expense", "#ef4444"), cat("c4", "Bills", "expense", "#3b82f6"),
];

beforeEach(() => {
  vi.clearAllMocks();
  categoryService.list.mockResolvedValue(cats);
});

describe("halaman Kategori", () => {
  it("memisahkan kategori pemasukan dan pengeluaran", async () => {
    renderWithProviders(<Categories />);
    expect(await screen.findByText("Salary")).toBeTruthy();
    expect(screen.getByText("Food")).toBeTruthy();
    expect(categoryService.list).toHaveBeenCalledWith(undefined);
  });

  it("menambah kategori dan mengirim body yang valid; duplikat menampilkan pesan di field nama", async () => {
    const user = userEvent.setup();
    categoryService.create.mockRejectedValueOnce(new ApiError("CATEGORY_DUPLICATE", "dup", { status: 409 }));
    renderWithProviders(<Categories />);
    await screen.findByText("Salary");
    await user.click(screen.getAllByRole("button", { name: /tambah kategori/i })[0]);
    await user.type(await screen.findByLabelText(/^nama/i, { selector: "input" }).catch(() => screen.getAllByRole("textbox")[0]), "Kopi");
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));
    await waitFor(() => expect(categoryService.create).toHaveBeenCalled());
    expect(categoryService.create.mock.calls[0][0]).toEqual({ name: "Kopi", type: "expense", color: "#6366f1" });
    expect(await screen.findByText(/sudah dipakai pada tipe ini/i)).toBeTruthy();
  });

  it("hapus kategori yang dipakai menampilkan jumlah pemakaian dan tidak menghapus", async () => {
    const user = userEvent.setup();
    categoryService.remove.mockRejectedValueOnce(new ApiError("CATEGORY_IN_USE", "x", { status: 409, details: { transactionCount: 18, budgetCount: 2 } }));
    renderWithProviders(<Categories />);
    await screen.findByText("Food");
    const row = screen.getByText("Food").closest("li");
    await user.click(within(row).getByRole("button", { name: /hapus/i }));
    const confirm = (await screen.findAllByRole("button", { name: /^hapus$/i })).pop();
    await user.click(confirm);
    await waitFor(() => expect(categoryService.remove).toHaveBeenCalled());
    expect(categoryService.remove.mock.calls[0][0]).toBe("c3");
    expect(await screen.findByText(/18 transaksi dan 2 anggaran/i)).toBeTruthy();
  });

  it("menampilkan error state saat daftar gagal dimuat", async () => {
    categoryService.list.mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "x", { status: 0 }));
    renderWithProviders(<Categories />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
