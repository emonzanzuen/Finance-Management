// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./helpers.jsx";
import { ApiError } from "../src/api/errors.js";
import { tokenStore } from "../src/api/tokenStore.js";

vi.mock("../src/api/services/auth.js", () => ({
  authService: { register: vi.fn(), login: vi.fn(), logout: vi.fn(), profile: vi.fn() },
}));
import { authService } from "../src/api/services/auth.js";
import Login from "../src/pages/Login/Login.jsx";
import Register from "../src/pages/Register/Register.jsx";
import { useAuth } from "../src/context/AuthContext.jsx";

const user = { id: "u1", name: "Budi", email: "budi@example.com", avatar: null };

function Status() {
  const { status, user: u } = useAuth();
  return <div data-testid="status">{status}:{u?.name ?? "-"}</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  tokenStore.clear();
});

describe("Login", () => {
  it("memvalidasi isian sebelum memanggil API", async () => {
    const u = userEvent.setup();
    renderWithProviders(<Login />);
    await u.click(screen.getByRole("button", { name: /masuk/i }));
    expect(await screen.findByText(/Email wajib diisi/i)).toBeTruthy();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("mengirim email ternormalisasi dan menyimpan token saat berhasil", async () => {
    authService.login.mockResolvedValue({ token: "jwt-abc", user });
    const u = userEvent.setup();
    renderWithProviders(<Login />);
    await u.type(screen.getByLabelText(/email/i), " Budi@Example.com ");
    await u.type(document.getElementById("password"), "Rahasia123");
    await u.click(screen.getByRole("button", { name: /masuk/i }));
    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({ email: "budi@example.com", password: "Rahasia123" }));
    expect(tokenStore.get()).toBe("jwt-abc");
  });

  it("menampilkan pesan umum untuk INVALID_CREDENTIALS dan tidak menyimpan token", async () => {
    authService.login.mockRejectedValue(new ApiError("INVALID_CREDENTIALS", "x", { status: 401 }));
    const u = userEvent.setup();
    renderWithProviders(<Login />);
    await u.type(screen.getByLabelText(/email/i), "budi@example.com");
    await u.type(document.getElementById("password"), "salahsalah1");
    await u.click(screen.getByRole("button", { name: /masuk/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Email atau password salah/i)).toBeTruthy();
    expect(tokenStore.get()).toBeNull();
  });
});

describe("Register", () => {
  it("menolak password lemah di sisi klien", async () => {
    const u = userEvent.setup();
    renderWithProviders(<Register />);
    await u.type(document.getElementById("name"), "Budi");
    await u.type(document.getElementById("email"), "budi@example.com");
    await u.type(document.getElementById("password"), "abcdefgh");
    await u.type(document.getElementById("confirmPassword"), "abcdefgh");
    await u.click(screen.getByRole("button", { name: /^daftar$/i }));
    expect((await screen.findAllByText(/huruf dan angka/i)).length).toBeGreaterThan(0);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("mendaftar dengan body sesuai kontrak (tanpa confirmPassword)", async () => {
    authService.register.mockResolvedValue({ token: "jwt-new", user });
    const u = userEvent.setup();
    renderWithProviders(<Register />);
    await u.type(document.getElementById("name"), "Budi");
    await u.type(document.getElementById("email"), "Budi@Example.com");
    await u.type(document.getElementById("password"), "Rahasia123");
    await u.type(document.getElementById("confirmPassword"), "Rahasia123");
    await u.click(screen.getByRole("button", { name: /^daftar$/i }));
    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({ name: "Budi", email: "budi@example.com", password: "Rahasia123" }));
  });

  it("memetakan EMAIL_TAKEN ke pesan yang dapat dipahami", async () => {
    authService.register.mockRejectedValue(new ApiError("EMAIL_TAKEN", "x", { status: 409 }));
    const u = userEvent.setup();
    renderWithProviders(<Register />);
    await u.type(document.getElementById("name"), "Budi");
    await u.type(document.getElementById("email"), "budi@example.com");
    await u.type(document.getElementById("password"), "Rahasia123");
    await u.type(document.getElementById("confirmPassword"), "Rahasia123");
    await u.click(screen.getByRole("button", { name: /^daftar$/i }));
    expect(await screen.findByText(/Email sudah terdaftar/i)).toBeTruthy();
  });
});

describe("AuthProvider", () => {
  it("tanpa token berstatus signedOut", async () => {
    renderWithProviders(<Status />);
    expect(screen.getByTestId("status").textContent).toBe("signedOut:-");
  });

  it("dengan token valid memuat profil dan berstatus signedIn", async () => {
    tokenStore.set("jwt-abc");
    authService.profile.mockResolvedValue(user);
    renderWithProviders(<Status />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("signedIn:Budi"));
  });

  it("401 saat memeriksa token menghapus token dan keluar", async () => {
    tokenStore.set("jwt-expired");
    authService.profile.mockRejectedValue(new ApiError("UNAUTHORIZED", "x", { status: 401 }));
    renderWithProviders(<Status />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("signedOut:-"));
    expect(tokenStore.get()).toBeNull();
  });

  it("server tidak terjangkau saat start berstatus error (token dipertahankan)", async () => {
    tokenStore.set("jwt-abc");
    authService.profile.mockRejectedValue(new ApiError("NETWORK_ERROR", "x", { status: 0 }));
    renderWithProviders(<Status />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("error:-"));
    expect(tokenStore.get()).toBe("jwt-abc");
  });
});
