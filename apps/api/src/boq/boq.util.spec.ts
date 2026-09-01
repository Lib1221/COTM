import { computeBoqTotal } from './boq.util';

describe('computeBoqTotal', () => {
  it('calculates quantity × unit price', () => {
    expect(computeBoqTotal(100, 500)).toBe(50000);
  });

  it('rounds to two decimal places', () => {
    expect(computeBoqTotal(3, 1.125)).toBe(3.38);
  });

  it('handles zero quantity', () => {
    expect(computeBoqTotal(0, 100)).toBe(0);
  });
});
