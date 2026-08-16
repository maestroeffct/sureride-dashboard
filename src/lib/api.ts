export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (
    typeof window !== "undefined" &&
    !headers.has("Authorization") &&
    localStorage.getItem("sureride_admin_token")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${localStorage.getItem("sureride_admin_token")}`,
    );
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  // Unauthorized / expired token — the admin dashboard previously
  // threw the raw "Invalid token or Expired Token" string into the
  // page instead of returning the user to login. Clear the stale
  // token and bounce to /login with a next= param so the user lands
  // back on the same page after re-auth.
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("sureride_admin_token");
    const path = window.location.pathname + window.location.search;
    const next = encodeURIComponent(path);
    // Guard against redirect loops if the user is already on /login.
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?next=${next}`;
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Something went wrong";

    throw new Error(message);
  }

  return data as T;
}
