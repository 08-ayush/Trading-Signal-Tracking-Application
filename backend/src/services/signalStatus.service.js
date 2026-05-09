import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { computeRoiPercent, toDecimal } from "../utils/decimal.js";
import { getBinancePrice } from "./binance.service.js";

const TERMINAL = new Set(["TARGET_HIT", "STOPLOSS_HIT", "EXPIRED"]);

/**
 * Core business rules for moving OPEN signals based on time and live price.
 * Terminal signals are never modified.
 *
 * @param {import('@prisma/client').TradingSignal} signal
 * @returns {Promise<{
 *   signal: import('@prisma/client').TradingSignal,
 *   currentPrice: string | null,
 *   roiPercent: number | null,
 *   binanceError: string | null
 * }>}
 */
export async function updateSignalStatus(signal) {
  let currentPrice = null;
  let binanceError = null;

  if (TERMINAL.has(signal.status)) {
    try {
      currentPrice = await getBinancePrice(signal.symbol);
    } catch (e) {
      binanceError = e?.message ?? "Could not fetch live price";
    }

    const roiStored =
      signal.realized_roi != null ? Number(signal.realized_roi) : null;

    let roiPercent = roiStored;
    if (roiPercent == null && currentPrice != null) {
      roiPercent = computeRoiPercent(
        toDecimal(currentPrice),
        signal.entry_price,
        signal.direction
      );
    }

    return {
      signal,
      currentPrice,
      roiPercent,
      binanceError,
    };
  }

  const now = new Date();
  if (signal.status === "OPEN" && now > new Date(signal.expiry_time)) {
    const updated = await prisma.tradingSignal.update({
      where: { id: signal.id },
      data: {
        status: "EXPIRED",
        realized_roi: null,
      },
    });

    try {
      currentPrice = await getBinancePrice(signal.symbol);
    } catch (e) {
      binanceError = e?.message ?? "Could not fetch live price";
    }

    return {
      signal: updated,
      currentPrice,
      roiPercent:
        currentPrice != null
          ? computeRoiPercent(
              toDecimal(currentPrice),
              updated.entry_price,
              updated.direction
            )
          : null,
      binanceError,
    };
  }

  try {
    currentPrice = await getBinancePrice(signal.symbol);
  } catch (e) {
    binanceError = e?.message ?? "Could not fetch live price";
    return {
      signal,
      currentPrice: null,
      roiPercent: null,
      binanceError,
    };
  }

  const live = toDecimal(currentPrice);
  const { direction } = signal;

  if (direction === "BUY") {
    if (live.greaterThanOrEqualTo(signal.target_price)) {
      const roi = computeRoiPercent(live, signal.entry_price, "BUY");
      const updated = await prisma.tradingSignal.update({
        where: { id: signal.id },
        data: {
          status: "TARGET_HIT",
          realized_roi: new Prisma.Decimal(roi),
        },
      });
      return {
        signal: updated,
        currentPrice,
        roiPercent: roi,
        binanceError: null,
      };
    }
    if (live.lessThanOrEqualTo(signal.stop_loss)) {
      const roi = computeRoiPercent(live, signal.entry_price, "BUY");
      const updated = await prisma.tradingSignal.update({
        where: { id: signal.id },
        data: {
          status: "STOPLOSS_HIT",
          realized_roi: new Prisma.Decimal(roi),
        },
      });
      return {
        signal: updated,
        currentPrice,
        roiPercent: roi,
        binanceError: null,
      };
    }
  } else if (direction === "SELL") {
    if (live.lessThanOrEqualTo(signal.target_price)) {
      const roi = computeRoiPercent(live, signal.entry_price, "SELL");
      const updated = await prisma.tradingSignal.update({
        where: { id: signal.id },
        data: {
          status: "TARGET_HIT",
          realized_roi: new Prisma.Decimal(roi),
        },
      });
      return {
        signal: updated,
        currentPrice,
        roiPercent: roi,
        binanceError: null,
      };
    }
    if (live.greaterThanOrEqualTo(signal.stop_loss)) {
      const roi = computeRoiPercent(live, signal.entry_price, "SELL");
      const updated = await prisma.tradingSignal.update({
        where: { id: signal.id },
        data: {
          status: "STOPLOSS_HIT",
          realized_roi: new Prisma.Decimal(roi),
        },
      });
      return {
        signal: updated,
        currentPrice,
        roiPercent: roi,
        binanceError: null,
      };
    }
  }

  const unrealizedRoi = computeRoiPercent(
    live,
    signal.entry_price,
    signal.direction
  );

  return {
    signal,
    currentPrice,
    roiPercent: unrealizedRoi,
    binanceError: null,
  };
}
