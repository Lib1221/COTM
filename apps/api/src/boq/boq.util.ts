/** Server-side BOQ total: quantity × unit price, rounded to 2 decimal places. */
export function computeBoqTotal(quantity: number, unitPrice: number): number {
  return Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
}
