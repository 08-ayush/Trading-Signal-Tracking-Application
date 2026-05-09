import { Prisma } from "@prisma/client";
import { AppError } from "./AppError.js";
import { toDecimal } from "./decimal.js";
import { normalizeSymbol, isAppAllowedTradingSymbol } from "./symbol.js";

/**
 * Validates create payload. Throws AppError 400 on failure.
 * entry_time may be in the past (not validated as future-only).
 */
export function validateSignalPayload(body) {
  const {
    symbol,
    direction,
    entry_price,
    stop_loss,
    target_price,
    entry_time,
    expiry_time,
  } = body;

  const errors = [];

  const normSymbol = normalizeSymbol(symbol);
  if (!normSymbol) {
    errors.push({ field: "symbol", message: "Symbol is required" });
  } else if (!isAppAllowedTradingSymbol(normSymbol)) {
    errors.push({
      field: "symbol",
      message:
        "Symbol must be one of the supported pairs (e.g. BTCUSDT, ETHUSDT, BNBUSDT).",
    });
  }

  if (direction !== "BUY" && direction !== "SELL") {
    errors.push({ field: "direction", message: "Direction must be BUY or SELL" });
  }

  let entryPrice;
  let stopLoss;
  let targetPrice;
  try {
    if (entry_price === undefined || entry_price === "") {
      throw new Error("missing");
    }
    if (stop_loss === undefined || stop_loss === "") {
      throw new Error("missing");
    }
    if (target_price === undefined || target_price === "") {
      throw new Error("missing");
    }
    entryPrice = toDecimal(entry_price);
    stopLoss = toDecimal(stop_loss);
    targetPrice = toDecimal(target_price);
  } catch {
    errors.push({
      field: "prices",
      message: "entry_price, stop_loss, and target_price must be valid numbers",
    });
  }

  if (!entry_time || !expiry_time) {
    errors.push({
      field: "times",
      message: "entry_time and expiry_time are required",
    });
  }

  const entryTime = entry_time ? new Date(entry_time) : null;
  const expiryTime = expiry_time ? new Date(expiry_time) : null;

  if (entryTime && Number.isNaN(entryTime.getTime())) {
    errors.push({ field: "entry_time", message: "Invalid entry_time" });
  }
  if (expiryTime && Number.isNaN(expiryTime.getTime())) {
    errors.push({ field: "expiry_time", message: "Invalid expiry_time" });
  }

  if (
    entryTime &&
    expiryTime &&
    !Number.isNaN(entryTime.getTime()) &&
    !Number.isNaN(expiryTime.getTime()) &&
    expiryTime <= entryTime
  ) {
    errors.push({
      field: "expiry_time",
      message: "expiry_time must be after entry_time",
    });
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }

  if (direction === "BUY") {
    if (!(stopLoss.lessThan(entryPrice))) {
      throw new AppError("Validation failed", 400, [
        {
          field: "stop_loss",
          message: "For BUY, stop_loss must be less than entry_price",
        },
      ]);
    }
    if (!(targetPrice.greaterThan(entryPrice))) {
      throw new AppError("Validation failed", 400, [
        {
          field: "target_price",
          message: "For BUY, target_price must be greater than entry_price",
        },
      ]);
    }
  }

  if (direction === "SELL") {
    if (!(stopLoss.greaterThan(entryPrice))) {
      throw new AppError("Validation failed", 400, [
        {
          field: "stop_loss",
          message: "For SELL, stop_loss must be greater than entry_price",
        },
      ]);
    }
    if (!(targetPrice.lessThan(entryPrice))) {
      throw new AppError("Validation failed", 400, [
        {
          field: "target_price",
          message: "For SELL, target_price must be less than entry_price",
        },
      ]);
    }
  }

  return {
    symbol: normSymbol,
    direction,
    entry_price: entryPrice,
    stop_loss: stopLoss,
    target_price: targetPrice,
    entry_time: entryTime,
    expiry_time: expiryTime,
  };
}
