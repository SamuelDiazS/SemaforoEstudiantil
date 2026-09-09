// ============================================================
// El driver de @neondatabase/serverless lanza errores que incluyen
// el código de error de PostgreSQL en la propiedad `code`.
// El código 23505 corresponde a "unique_violation".
// ============================================================

export function isUniqueViolation(error: unknown, constraintName?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; constraint?: string };
  if (err.code !== "23505") return false;
  if (constraintName && err.constraint !== constraintName) return false;
  return true;
}
