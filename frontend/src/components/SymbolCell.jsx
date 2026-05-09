import { useEffect, useState } from "react";
import { SYMBOL_PRESETS } from "../constants/symbolPresets.js";
import { signalsApi } from "../services/api.js";
import {
  badSymbolHint,
  suggestDefaultUsdtPair,
  symbolLooksInvalid,
} from "../utils/symbolDisplay.js";

const selectClass =
  "w-full rounded-md border border-slate-600 bg-slate-950/80 px-2 py-1.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40";

export default function SymbolCell({ row, compact, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.symbol);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState(null);

  const canEdit =
    row.status === "OPEN" &&
    (symbolLooksInvalid(row.symbol) ||
      (row.price_error != null &&
        /invalid|unknown|symbol/i.test(String(row.price_error))));

  useEffect(() => {
    setValue(SYMBOL_PRESETS.includes(row.symbol) ? row.symbol : "BTCUSDT");
  }, [row.symbol]);

  async function patchSymbol(nextSymbol) {
    setLocalError(null);
    setSaving(true);
    try {
      await signalsApi.patch(row.id, { symbol: nextSymbol });
      setEditing(false);
      setValue(nextSymbol);
      onUpdated?.();
    } catch (err) {
      setLocalError(err.message ?? "Could not update symbol");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await patchSymbol(value);
  }

  const quickPair = suggestDefaultUsdtPair(row.symbol);

  if (editing) {
    return (
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={compact ? "space-y-2" : "flex min-w-[200px] flex-col gap-2 sm:flex-row sm:items-center"}
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${selectClass} font-mono`}
        >
          {SYMBOL_PRESETS.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(row.symbol);
              setLocalError(null);
            }}
            className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
        {localError && (
          <p className="text-xs text-rose-300">{localError}</p>
        )}
      </form>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "max-w-xs"}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-mono ${
            canEdit ? "text-amber-200" : "text-slate-100"
          }`}
          title={
            canEdit
              ? "Not a valid Binance pair — live price cannot load."
              : undefined
          }
        >
          {row.symbol}
        </span>
        {canEdit && (
          <>
            {quickPair && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void patchSymbol(quickPair)}
                className="rounded border border-sky-500/50 bg-sky-600/30 px-2 py-0.5 text-xs font-semibold text-sky-100 hover:bg-sky-600/50 disabled:opacity-50"
              >
                Use {quickPair}
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setValue(
                  SYMBOL_PRESETS.includes(row.symbol) ? row.symbol : "BTCUSDT"
                );
                setEditing(true);
              }}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
            >
              Fix symbol
            </button>
          </>
        )}
      </div>
      {canEdit && (
        <p
          className={`text-[11px] leading-snug text-slate-500 ${
            compact ? "mt-1 max-w-[240px]" : ""
          }`}
        >
          {badSymbolHint(row.symbol)}
        </p>
      )}
      {localError && !editing && (
        <p className="text-xs text-rose-300">{localError}</p>
      )}
    </div>
  );
}
