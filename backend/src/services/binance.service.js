import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { normalizeSymbol } from "../utils/symbol.js";

/**
 * Fetches last trade price for a Binance symbol (e.g. BTCUSDT).
 * @param {string} symbol
 * @returns {Promise<string>} Price as string (Binance format)
 */
export async function getBinancePrice(symbol) {
  const sym = normalizeSymbol(symbol);
  if (!sym) {
    throw new AppError("Invalid or empty symbol", 400);
  }

  const url = `${env.BINANCE_BASE_URL}/api/v3/ticker/price`;

  try {
    const { data, status } = await axios.get(url, {
      params: { symbol: sym },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (status === 400 || status === 404) {
      throw new AppError(
        `Unknown or invalid Binance symbol: ${sym}`,
        400
      );
    }

    if (status !== 200 || data == null || typeof data.price !== "string") {
      throw new AppError("Binance returned an unexpected response", 502);
    }

    return data.price;
  } catch (e) {
    if (e instanceof AppError) {
      throw e;
    }
    if (axios.isAxiosError(e)) {
      if (e.code === "ECONNABORTED") {
        throw new AppError("Binance API request timed out", 504);
      }
      throw new AppError("Failed to reach Binance API", 502);
    }
    throw e;
  }
}
