import SymbolCell from "./SymbolCell.jsx";
import { statusBadgeClass } from "../utils/statusStyles.js";
import { formatPrice, formatRoi, formatTimeRemaining } from "../utils/format.js";

/** Short label for LIVE column; full message in title tooltip */
function livePriceErrorLabel(message) {
  if (!message) return "—";
  if (/unknown|invalid/i.test(message) && /symbol/i.test(message)) {
    return "Bad symbol";
  }
  if (/timed out|timeout/i.test(message)) return "Timeout";
  if (/502|504|reach|binance/i.test(message)) return "API issue";
  return "No price";
}

export default function SignalsTable({
  signals,
  now,
  deletingId,
  onDelete,
  onSymbolUpdated,
}) {
  if (!signals.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/30 md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3 text-right">Entry</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Stop</th>
              <th className="px-4 py-3 text-right">Live price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">ROI %</th>
              <th className="px-4 py-3">Time left</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {signals.map((row) => (
              <tr key={row.id} className="bg-slate-950/20 hover:bg-slate-900/50">
                <td className="px-4 py-3 align-top text-slate-100">
                  <SymbolCell row={row} onUpdated={onSymbolUpdated} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.direction === "BUY"
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }
                  >
                    {row.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatPrice(row.entry_price)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatPrice(row.target_price)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatPrice(row.stop_loss)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sky-200">
                  {row.current_price != null
                    ? formatPrice(row.current_price)
                    : row.price_error
                      ? (
                        <span
                          title={row.price_error}
                          className="cursor-help text-rose-300 underline decoration-dotted decoration-rose-500/60 underline-offset-2"
                        >
                          {livePriceErrorLabel(row.price_error)}
                        </span>
                        )
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                      row.status
                    )}`}
                  >
                    {row.status.replace("_", " ")}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
                    row.roi_percent != null && row.roi_percent >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {row.roi_percent != null
                    ? formatRoi(row.roi_percent)
                    : row.realized_roi != null
                      ? formatRoi(row.realized_roi)
                      : "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {formatTimeRemaining(row.expiry_time, now)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    disabled={deletingId === row.id}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {deletingId === row.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {signals.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SymbolCell row={row} compact onUpdated={onSymbolUpdated} />
                <p className="mt-2 text-xs text-slate-400">
                  {row.direction} · {formatTimeRemaining(row.expiry_time, now)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                  row.status
                )}`}
              >
                {row.status.replace("_", " ")}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Entry</dt>
                <dd className="font-mono text-slate-100">
                  {formatPrice(row.entry_price)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Target</dt>
                <dd className="font-mono text-slate-100">
                  {formatPrice(row.target_price)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Stop</dt>
                <dd className="font-mono text-slate-100">
                  {formatPrice(row.stop_loss)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Live price</dt>
                <dd className="font-mono text-sky-200">
                  {row.current_price != null
                    ? formatPrice(row.current_price)
                    : row.price_error
                      ? (
                        <span title={row.price_error} className="cursor-help">
                          {livePriceErrorLabel(row.price_error)}
                        </span>
                        )
                      : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">ROI %</dt>
                <dd
                  className={`font-mono ${
                    row.roi_percent != null && row.roi_percent >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {row.roi_percent != null
                    ? formatRoi(row.roi_percent)
                    : row.realized_roi != null
                      ? formatRoi(row.realized_roi)
                      : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                disabled={deletingId === row.id}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100"
              >
                {deletingId === row.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
