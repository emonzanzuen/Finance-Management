// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, cat, tx } from "./helpers.jsx";
import { ApiError } from "../src/api/errors.js";

vi.mock("../src/api/services/transactions.js", () => ({
  transactionService: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
vi.mock("../src/api/services/categories.js", () => ({
  categoryService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

import { transactionService } from "../src/api/services/transactions.js";
import { categoryService } from "../src/api/services/categories.js";
import Transactions from "../src/pages/Transactions/Transactions.jsx";

const cats = [cat("c-food", "Food", "expense", "#ef4444"), cat("c-sal", "Salary", "income")];
const page1 = { items: [tx("t1"), tx("t2", { type: "income", amount: 5000000, description: "Gaji", category: { id: "c-sal", name: "Salary", color: "#22c55e" } })],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 } };

beforeEach(() => {
  vi.clearAllMocks();
  categoryService.list.mockImplementation(async (type) => (type ? cats.filter((c) => c.type === type) : cats));
  transactionService.list.mockResolvedValue(page1);
});

describe("halaman Transaksi", () => {
  it("memuat daftar dengan parameter default sesuai kontrak dan menampilkan baris", async () => {
    renderWithProviders(<Transactions />);
    expect(await screen.findByText("Makan siang")).toBeTruthy();
    expect(screen.getByText("Gaji")).toBeTruthy();
    expect(transactionService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, sortBy: "transactionDate", sortOrder: "desc" }),
    );
  });

  it("filter tipe memanggil API dengan type dan mengosongkan kategori", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Transactions />);
    await screen.findByText("Makan siang");
    const typeSelect = screen.getAllByRole("combobox").find((s) => s.getAttribute("aria-label")?.toLowerCase().includes("tipe") || s.getAttribute("aria-label")?.toLowerCase().includes("type"));
    await user.selectOptions(typeSelect, "income");
    await waitFor(() =>
      expect(transactionService.list).toHaveBeenLastCalledWith(expect.objectContaining({ type: "income", page: 1 })),
    );
  });

  it("menampilkan state error dengan tombol coba lagi saat API gagal", async () => {
    transactionService.list.mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "x", { status: 0 }));
    renderWithProviders(<Transactions />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Tidak dapat terhubung ke server/i)).toBeTruthy();
  });

  it("menampilkan empty state bila belum ada transaksi", async () => {
    transactionService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    renderWithProviders(<Transactions />);
    await waitFor(() => expect(screen.queryByText("Makan siang")).toBeNull());
    expect(await screen.findAllByText(/Belum ada transaksi|Tambah transaksi pertama/i)).toBeTruthy();
  });

  it("menghapus transaksi lewat dialog konfirmasi", async () => {
    transactionService.remove.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<Transactions />);
    await screen.findByText("Makan siang");
    const row = screen.getByText("Makan siang").closest("tr");
    await user.click(within(row).getByRole("button", { name: /hapus|delete/i }));
    const dialog = await screen.findByText(/Hapus transaksi ini/i);
    expect(dialog).toBeTruthy();
    const confirm = screen.getAllByRole("button", { name: /^hapus$|^delete$/i }).pop();
    await user.click(confirm);
    await waitFor(() => expect(transactionService.remove).toHaveBeenCalled());
    expect(transactionService.remove.mock.calls[0][0]).toBe("t1");
  });

  it("form tambah memvalidasi nominal dan mengirim body sesuai kontrak", async () => {
    transactionService.create.mockResolvedValue(tx("new"));
    const user = userEvent.setup();
    renderWithProviders(<Transactions />);
    await screen.findByText("Makan siang");
    await user.click(screen.getAllByRole("button", { name: /tambah transaksi/i })[0]);
    await user.click(await screen.findByRole("button", { name: /^simpan$/i }));
    expect(await screen.findAllByText(/wajib|lebih dari 0|Pilih kategori/i)).toBeTruthy();
    expect(transactionService.create).not.toHaveBeenCalled();

    await user.selectOptions(await screen.findByLabelText(/kategori/i, { selector: "select#categoryId" }), "c-food");
    await user.type(screen.getByLabelText(/nominal/i), "45000");
    await user.type(screen.getByLabelText(/deskripsi/i), "Kopi");
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));
    await waitFor(() => expect(transactionService.create).toHaveBeenCalled());
    const body = transactionService.create.mock.calls[0][0];
    expect(body).toMatchObject({ type: "expense", categoryId: "c-food", amount: 45000, description: "Kopi" });
    expect(body.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(body).sort()).toEqual(["amount", "categoryId", "description", "transactionDate", "type"]);
  });
});
