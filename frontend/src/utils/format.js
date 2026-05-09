export function formatRoi(value) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }
  const n = Number(value);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatPrice(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return String(value);
  }
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

/**
 * @param {string} expiryIso
 * @param {Date} now
 */
export function formatTimeRemaining(expiryIso, now) {
  const end = new Date(expiryIso).getTime();
  const t = now.getTime();
  const diff = end - t;
  if (diff <= 0) {
    return "Expired";
  }
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (days > 0) {
    return `${days}d ${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h ${m}m ${sec}s`;
  }
  return `${m}m ${sec}s`;
}
