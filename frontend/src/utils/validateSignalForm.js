import { SYMBOL_PRESETS } from "../constants/symbolPresets.js";
import { normalizeSymbolInput } from "./symbolDisplay.js";

/**
 * Client-side validation mirroring backend rules.
 * @returns {{ ok: true } | { ok: false, errors: Record<string, string> }}
 */
export function validateSignalForm(values) {
  const errors = {};

  const symbol = normalizeSymbolInput(values.symbol);
  if (!symbol) {
    errors.symbol = "Choose a symbol from the list.";
  } else if (!SYMBOL_PRESETS.includes(symbol)) {
    errors.symbol = "Pick one of the supported pairs.";
  }

  if (values.direction !== "BUY" && values.direction !== "SELL") {
    errors.direction = "Choose BUY or SELL.";
  }

  const entry = parseFloat(values.entry_price);
  const sl = parseFloat(values.stop_loss);
  const tp = parseFloat(values.target_price);

  if (
    Number.isNaN(entry) ||
    Number.isNaN(sl) ||
    Number.isNaN(tp)
  ) {
    errors.prices = "Entry, stop loss, and target must be valid numbers.";
  }

  if (!values.entry_time) {
    errors.entry_time = "Entry time is required.";
  }
  if (!values.expiry_time) {
    errors.expiry_time = "Expiry time is required.";
  }

  const entryTime = values.entry_time ? new Date(values.entry_time) : null;
  const expiryTime = values.expiry_time ? new Date(values.expiry_time) : null;

  if (values.entry_time && Number.isNaN(entryTime?.getTime?.())) {
    errors.entry_time = "Invalid entry time.";
  }
  if (values.expiry_time && Number.isNaN(expiryTime?.getTime?.())) {
    errors.expiry_time = "Invalid expiry time.";
  }

  if (
    entryTime &&
    expiryTime &&
    !Number.isNaN(entryTime.getTime()) &&
    !Number.isNaN(expiryTime.getTime()) &&
    expiryTime <= entryTime
  ) {
    errors.expiry_time = "Expiry must be after entry time.";
  }

  if (!errors.prices && values.direction === "BUY") {
    if (!(sl < entry)) {
      errors.stop_loss = "For BUY, stop loss must be below entry.";
    }
    if (!(tp > entry)) {
      errors.target_price = "For BUY, target must be above entry.";
    }
  }

  if (!errors.prices && values.direction === "SELL") {
    if (!(sl > entry)) {
      errors.stop_loss = "For SELL, stop loss must be above entry.";
    }
    if (!(tp < entry)) {
      errors.target_price = "For SELL, target must be below entry.";
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, normalizedSymbol: symbol };
}
