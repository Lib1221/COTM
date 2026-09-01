import { Transform } from 'class-transformer';

/** Trim string query/body fields before validation. */
export function Trim() {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

/**
 * Query-string booleans arrive as "true"/"false". `Boolean("false") === true`,
 * so we parse explicitly.
 */
export function ToBoolean() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  });
}
