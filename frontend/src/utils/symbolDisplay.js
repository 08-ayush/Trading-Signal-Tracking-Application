import { SYMBOL_PRESETS } from "../constants/symbolPresets.js";

export function normalizeSymbolInput(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** True when the stored symbol is not one of the two allowed pairs */
export function symbolLooksInvalid(symbol) {
  const s = normalizeSymbolInput(symbol);
  return !SYMBOL_PRESETS.includes(s);
}

const QUOTE_ONLY = new Set(["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "EUR", "TRY"]);

export function badSymbolHint(symbol) {
  const s = normalizeSymbolInput(symbol);
  if (QUOTE_ONLY.has(s)) {
    return "Quote alone is not a market — pick a full pair from the list.";
  }
  return "Choose a supported pair (dropdown) with Fix symbol or the quick button.";
}

/** One-click fix: map common lone bases to the app list when obvious */
export function suggestDefaultUsdtPair(symbol) {
  const s = normalizeSymbolInput(symbol);
  const map = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    BNB: "BNBUSDT",
    SOL: "SOLUSDT",
    XRP: "XRPUSDT",
    ADA: "ADAUSDT",
    DOGE: "DOGEUSDT",
    AVAX: "AVAXUSDT",
    MATIC: "MATICUSDT",
    LINK: "LINKUSDT",
  };
  return map[s] ?? null;
}
