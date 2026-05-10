import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Official market-data host; often works from cloud regions where api.binance.com does not. */
const DEFAULT_BINANCE_BASE = "https://data-api.binance.vision";

/**
 * @param {string | undefined} raw
 */
function normalizeBinanceBaseUrl(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim().replace(/\/$/, "");
  if (!s) return "";
  const m = /^BINANCE_BASE_URL\s*=\s*(.+)$/i.exec(s);
  if (m) s = m[1].trim().replace(/\/$/, "");
  s = s.replace(/\/api\/v3\/.*$/i, "").replace(/\/$/, "");
  return s;
}

const binanceFromEnv = normalizeBinanceBaseUrl(process.env.BINANCE_BASE_URL);

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number.parseInt(process.env.PORT ?? "4000", 10),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  BINANCE_BASE_URL: binanceFromEnv || DEFAULT_BINANCE_BASE,
};
