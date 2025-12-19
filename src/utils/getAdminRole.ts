export function getAdminRole() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("sureride_admin_user");
  if (!raw) return null;

  try {
    const admin = JSON.parse(raw);
    return admin.role as "SUPER_ADMIN" | "OPS" | "SUPPORT";
  } catch {
    return null;
  }
}
