export async function getCsrfToken(): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrfToken(): Promise<string> {
  let token = await getCsrfToken();
  if (!token) {
    try {
      const res = await fetch("/api/csrf", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok && json.token) {
        token = json.token;
      }
    } catch {
      // ignore
    }
  }
  return token || "";
}

export function withCsrfHeaders(headers: Record<string, string> = {}): Record<string, string> {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
    if (match) {
      headers["x-csrf-token"] = decodeURIComponent(match[1]);
    }
  }
  return headers;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (isMutation) {
    const token = await ensureCsrfToken();
    if (token) {
      headers["x-csrf-token"] = token;
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}