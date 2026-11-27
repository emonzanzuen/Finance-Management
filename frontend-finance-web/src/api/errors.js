/**
 * Kesalahan API yang seragam untuk web dan mock backend.
 * Bentuk mengikuti docs/contract.md: { error: { code, message, details } }.
 */
export class ApiError extends Error {
  constructor(code, message, { status = 400, details = null, headers = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.headers = headers;
  }
}

export const isApiError = (e) => e instanceof ApiError;

function collect(source, out) {
  if (Array.isArray(source)) {
    source.forEach((i) => {
      if (i && typeof i.path === "string") out[i.path] = i.message;
    });
  } else if (source && typeof source === "object") {
    Object.entries(source).forEach(([k, v]) => {
      if (typeof v === "string") out[k] = v;
    });
  }
}

/**
 * Peta { namaField: pesan } dari `details` kesalahan validasi.
 * Mendukung bentuk array [{ path, message }], objek { path: pesan }, atau { fields: ... }.
 */
export function fieldErrors(error) {
  const out = {};
  const d = error?.details;
  if (!d) return out;
  collect(d.fields ?? d, out);
  return out;
}

/** Ubah error Axios atau error lain menjadi ApiError. */
export function normalizeError(err) {
  if (err instanceof ApiError) return err;
  const res = err?.response;
  const body = res?.data?.error;
  if (res && body) {
    return new ApiError(body.code ?? "UNKNOWN", body.message ?? "Terjadi kesalahan.", {
      status: res.status,
      details: body.details ?? null,
      headers: res.headers ?? null,
    });
  }
  if (res) return new ApiError("UNKNOWN", "Terjadi kesalahan.", { status: res.status });
  if (err?.code === "ECONNABORTED" || err?.code === "ERR_NETWORK" || err?.request) {
    return new ApiError("NETWORK_ERROR", "Tidak dapat terhubung ke server.", { status: 0 });
  }
  return new ApiError("UNKNOWN", err?.message ?? "Terjadi kesalahan.", { status: 0 });
}
