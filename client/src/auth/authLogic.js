export const ADMIN_EMAIL = "vrbitesrestaurant@gmail.com";

export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

export function isAdminEmail(email) {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function getRoleByEmail(email) {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}
