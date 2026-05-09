import { prisma } from "../config/database.js";
import { toSignalDto } from "../utils/signalDto.js";
import { validateSignalPayload } from "../utils/validateSignalInput.js";
import { AppError } from "../utils/AppError.js";
import { isAppAllowedTradingSymbol, normalizeSymbol } from "../utils/symbol.js";
import { updateSignalStatus } from "./signalStatus.service.js";

/**
 * @param {object} body
 */
export async function createSignal(body) {
  const data = validateSignalPayload(body);

  const signal = await prisma.tradingSignal.create({
    data: {
      symbol: data.symbol,
      direction: data.direction,
      entry_price: data.entry_price,
      stop_loss: data.stop_loss,
      target_price: data.target_price,
      entry_time: data.entry_time,
      expiry_time: data.expiry_time,
    },
  });

  return toSignalDto(signal);
}

export async function listSignalsWithRefresh() {
  const rows = await prisma.tradingSignal.findMany({
    orderBy: { created_at: "desc" },
  });

  const results = await Promise.all(
    rows.map(async (row) => {
      const refreshed = await updateSignalStatus(row);
      return toSignalDto(refreshed.signal, {
        currentPrice: refreshed.currentPrice ?? undefined,
        roiPercent:
          refreshed.roiPercent !== undefined && refreshed.roiPercent !== null
            ? refreshed.roiPercent
            : undefined,
        binanceError: refreshed.binanceError,
      });
    })
  );

  return results;
}

/**
 * @param {string} id
 */
export async function getSignalByIdWithRefresh(id) {
  const row = await prisma.tradingSignal.findUnique({ where: { id } });
  if (!row) {
    throw new AppError("Signal not found", 404);
  }
  const refreshed = await updateSignalStatus(row);
  return toSignalDto(refreshed.signal, {
    currentPrice: refreshed.currentPrice ?? undefined,
    roiPercent:
      refreshed.roiPercent !== undefined && refreshed.roiPercent !== null
        ? refreshed.roiPercent
        : undefined,
    binanceError: refreshed.binanceError,
  });
}

/**
 * @param {string} id
 */
export async function deleteSignalById(id) {
  const existing = await prisma.tradingSignal.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Signal not found", 404);
  }
  await prisma.tradingSignal.delete({ where: { id } });
}

/**
 * Update symbol for an OPEN signal (e.g. fix a mistaken value stored before validation).
 * @param {string} id
 * @param {{ symbol?: unknown }} body
 */
export async function patchOpenSignalSymbol(id, body) {
  const raw =
    typeof body?.symbol === "string" ? body.symbol : String(body?.symbol ?? "");
  const normSymbol = normalizeSymbol(raw);
  if (!normSymbol) {
    throw new AppError("Validation failed", 400, [
      { field: "symbol", message: "Symbol is required" },
    ]);
  }
  if (!isAppAllowedTradingSymbol(normSymbol)) {
    throw new AppError("Validation failed", 400, [
      {
        field: "symbol",
        message:
          "Symbol must be one of the supported pairs (e.g. BTCUSDT, ETHUSDT).",
      },
    ]);
  }

  const existing = await prisma.tradingSignal.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Signal not found", 404);
  }
  if (existing.status !== "OPEN") {
    throw new AppError("Only OPEN signals can have their symbol changed", 400);
  }

  await prisma.tradingSignal.update({
    where: { id },
    data: { symbol: normSymbol },
  });

  return getSignalByIdWithRefresh(id);
}

/**
 * @param {string} id
 */
export async function getSignalStatusById(id) {
  const row = await prisma.tradingSignal.findUnique({ where: { id } });
  if (!row) {
    throw new AppError("Signal not found", 404);
  }

  const refreshed = await updateSignalStatus(row);

  return {
    signal: toSignalDto(refreshed.signal, {
      currentPrice: refreshed.currentPrice ?? undefined,
      roiPercent:
        refreshed.roiPercent !== undefined && refreshed.roiPercent !== null
          ? refreshed.roiPercent
          : undefined,
      binanceError: refreshed.binanceError,
    }),
    meta: {
      binance_error: refreshed.binanceError,
    },
  };
}
