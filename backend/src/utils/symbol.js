/**
 * Normalizes user input to Binance format (e.g. "btc/usdt" -> "BTCUSDT").
 */
export function normalizeSymbol(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return "";
  }
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Symbols allowed by this app (matches the new-signal form). */
export const APP_ALLOWED_SYMBOLS = Object.freeze([
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "MATICUSDT",
  "LINKUSDT",
]);

/**
 * @param {string} normalized Uppercase normalized symbol
 */
export function isAppAllowedTradingSymbol(normalized) {
  return (
    typeof normalized === "string" && APP_ALLOWED_SYMBOLS.includes(normalized)
  );
}
