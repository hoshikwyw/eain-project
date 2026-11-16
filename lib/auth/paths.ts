/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  return value;
}

/**
 * Remembers where a sign-up was heading until its confirmation email is
 * opened (app/auth/confirm). Set by the sign-up action, read once.
 */
export const AFTER_CONFIRM_COOKIE = "eain_after_confirm";
/** Confirmation links stay valid for a day; so does the remembered path. */
export const AFTER_CONFIRM_MAX_AGE = 60 * 60 * 24;
