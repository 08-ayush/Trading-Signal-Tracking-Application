import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { normalizeSymbol } from "../utils/symbol.js";

/** Binance public market-data API (same paths as api.binance.com; better reachability from many hosts). */
const MARKET_DATA_FALLBACK_BASE = "https://data-api.binance.vision";

function basesToTry() {
  const primary = env.BINANCE_BASE_URL.replace(/\/$/, "");
  const list = [primary];
  if (primary !== MARKET_DATA_FALLBACK_BASE) {
    list.push(MARKET_DATA_FALLBACK_BASE);
  }
  return list;
}

/**
 * Fetches last trade price for a Binance symbol (e.g. BTCUSDT).
 * Tries the configured host first, then the official market-data host if the first
 * call fails (common when production servers cannot reach api.binance.com).
 * @param {string} symbol
 * @returns {Promise<string>} Price as string (Binance format)
 */
export async function getBinancePrice(symbol) {
  const sym = normalizeSymbol(symbol);
  if (!sym) {
    throw new AppError("Invalid or empty symbol", 400);
  }

  const bases = basesToTry();
  let lastError = /** @type {AppError | null} */ (null);

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const url = `${base}/api/v3/ticker/price`;
    const canRetry = i < bases.length - 1;

    try {
      const { data, status } = await axios.get(url, {
        params: { symbol: sym },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (status === 400 || status === 404) {
        throw new AppError(`Unknown or invalid Binance symbol: ${sym}`, 400);
      }

      if (status === 200 && data != null && typeof data.price === "string") {
        return data.price;
      }

      const geoOrUpstream =
        status === 451 || status === 403 || status >= 500;
      const badPayload = data == null || typeof data.price !== "string";

      if (canRetry && (geoOrUpstream || badPayload)) {
        lastError = new AppError("Binance returned an unexpected response", 502);
        continue;
      }

      if (status === 451) {
        throw new AppError(
          "Binance blocked this host by region (HTTP 451). Set BINANCE_BASE_URL to https://data-api.binance.vision.",
          502
        );
      }

      throw new AppError("Binance returned an unexpected response", 502);
    } catch (e) {
      if (e instanceof AppError) {
        if (e.statusCode === 400) {
          throw e;
        }
        if (canRetry) {
          lastError = e;
          continue;
        }
        throw e;
      }

      if (axios.isAxiosError(e)) {
        if (e.code === "ECONNABORTED") {
          lastError = new AppError("Binance API request timed out", 504);
        } else {
          lastError = new AppError("Failed to reach Binance API", 502);
        }
        if (canRetry) {
          continue;
        }
        throw lastError;
      }

      throw e;
    }
  }

  throw lastError ?? new AppError("Failed to reach Binance API", 502);
}
