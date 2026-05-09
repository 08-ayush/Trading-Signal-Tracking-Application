import { Prisma } from "@prisma/client";

/**
 * @param {import('@prisma/client/runtime/library').Decimal | number | string} value
 * @returns {import('@prisma/client/runtime/library').Decimal}
 */
export function toDecimal(value) {
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  return new Prisma.Decimal(value);
}

/**
 * ROI rounded to 2 decimal places (number for JSON).
 * @param {import('@prisma/client/runtime/library').Decimal} current
 * @param {import('@prisma/client/runtime/library').Decimal} entry
 * @param {'BUY' | 'SELL'} direction
 */
export function computeRoiPercent(current, entry, direction) {
  const c = current.toNumber();
  const e = entry.toNumber();
  if (e === 0) {
    return 0;
  }
  let raw =
    direction === "BUY" ? ((c - e) / e) * 100 : ((e - c) / e) * 100;
  return Math.round(raw * 100) / 100;
}
