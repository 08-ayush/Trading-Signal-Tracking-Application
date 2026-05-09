import { useState } from "react";
import { SYMBOL_PRESETS } from "../constants/symbolPresets.js";
import { signalsApi } from "../services/api.js";
import { validateSignalForm } from "../utils/validateSignalForm.js";

const selectClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30";

const emptyFields = {
  symbol: "BTCUSDT",
  direction: "BUY",
  entry_price: "",
  stop_loss: "",
  target_price: "",
  entry_time: "",
  expiry_time: "",
};

/** @param {Date} d */
function toDateTimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function defaultTimes() {
  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    entry_time: toDateTimeLocalValue(now),
    expiry_time: toDateTimeLocalValue(expiry),
  };
}

function freshFormState() {
  return { ...emptyFields, ...defaultTimes() };
}

/** Split `YYYY-MM-DDTHH:mm` for separate date / time inputs */
function splitDateTime(combined) {
  if (!combined) {
    return { date: "", clock: "" };
  }
  const [date, rest] = combined.split("T");
  return { date: date ?? "", clock: rest ? rest.slice(0, 5) : "" };
}

function mergeDateTime(date, clock) {
  if (!date || !clock) {
    return "";
  }
  return `${date}T${clock}`;
}

export default function SignalForm({ onCreated }) {
  const [values, setValues] = useState(freshFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const result = validateSignalForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        symbol: result.normalizedSymbol,
        direction: values.direction,
        entry_price: Number.parseFloat(values.entry_price),
        stop_loss: Number.parseFloat(values.stop_loss),
        target_price: Number.parseFloat(values.target_price),
        entry_time: new Date(values.entry_time).toISOString(),
        expiry_time: new Date(values.expiry_time).toISOString(),
      };

      const res = await signalsApi.create(payload);
      setValues(freshFormState());
      onCreated?.(res?.data ?? res);
    } catch (err) {
      if (Array.isArray(err.details)) {
        const map = {};
        err.details.forEach((d) => {
          if (d.field) {
            map[d.field] = d.message;
          }
        });
        setErrors((prev) => ({ ...prev, ...map }));
      }
      setErrors((prev) => ({
        ...prev,
        form: err.message ?? "Could not create signal",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl shadow-slate-950/40 backdrop-blur sm:p-7">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">New signal</h2>
        <p className="text-sm text-slate-400">
          Choose one of the supported Binance USDT pairs below.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
            role="alert"
          >
            {errors.form}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-300">Symbol</span>
            <select
              name="symbol"
              value={values.symbol}
              onChange={onChange}
              required
              className={selectClass}
            >
              {SYMBOL_PRESETS.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
            {errors.symbol && (
              <span className="mt-1 block text-xs text-rose-300">{errors.symbol}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-300">Direction</span>
            <select
              name="direction"
              value={values.direction}
              onChange={onChange}
              className={selectClass}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            {errors.direction && (
              <span className="mt-1 block text-xs text-rose-300">{errors.direction}</span>
            )}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {["entry_price", "stop_loss", "target_price"].map((field) => (
            <label key={field} className="block text-sm">
              <span className="mb-1 block font-medium capitalize text-slate-300">
                {field.replace("_", " ")}
              </span>
              <input
                name={field}
                type="number"
                step="any"
                value={values[field]}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30"
              />
              {errors[field] && (
                <span className="mt-1 block text-xs text-rose-300">{errors[field]}</span>
              )}
            </label>
          ))}
        </div>
        {errors.prices && (
          <p className="text-xs text-rose-300">{errors.prices}</p>
        )}

        <div className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-950/25 p-4 sm:p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Entry time</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Pick the date, then the time — or use <span className="text-slate-400">Now</span>.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-300">Date</span>
              <input
                type="date"
                value={splitDateTime(values.entry_time).date}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    entry_time: mergeDateTime(
                      e.target.value,
                      splitDateTime(v.entry_time).clock
                    ),
                  }))
                }
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30"
              />
            </label>
            <label className="block flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-300">Time</span>
              <input
                type="time"
                step={60}
                value={splitDateTime(values.entry_time).clock}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    entry_time: mergeDateTime(
                      splitDateTime(v.entry_time).date,
                      e.target.value
                    ),
                  }))
                }
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  entry_time: toDateTimeLocalValue(new Date()),
                }))
              }
              className="shrink-0 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-700/80"
            >
              Now
            </button>
          </div>
          {errors.entry_time && (
            <span className="block text-xs text-rose-300">{errors.entry_time}</span>
          )}

          <div className="border-t border-slate-800/80 pt-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Expiry time</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Must be after entry. Use a preset or choose date and time below.
              </p>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const base = values.entry_time
                    ? new Date(values.entry_time)
                    : new Date();
                  const t = new Date(base.getTime() + 60 * 60 * 1000);
                  setValues((v) => ({ ...v, expiry_time: toDateTimeLocalValue(t) }));
                }}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                +1h from entry
              </button>
              <button
                type="button"
                onClick={() => {
                  const base = values.entry_time
                    ? new Date(values.entry_time)
                    : new Date();
                  const t = new Date(base.getTime() + 24 * 60 * 60 * 1000);
                  setValues((v) => ({ ...v, expiry_time: toDateTimeLocalValue(t) }));
                }}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                +24h from entry
              </button>
              <button
                type="button"
                onClick={() => {
                  const base = values.entry_time
                    ? new Date(values.entry_time)
                    : new Date();
                  const t = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
                  setValues((v) => ({ ...v, expiry_time: toDateTimeLocalValue(t) }));
                }}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                +7d from entry
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                <span className="mb-1 block font-medium text-slate-300">Date</span>
                <input
                  type="date"
                  min={splitDateTime(values.entry_time).date || undefined}
                  value={splitDateTime(values.expiry_time).date}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      expiry_time: mergeDateTime(
                        e.target.value,
                        splitDateTime(v.expiry_time).clock
                      ),
                    }))
                  }
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30"
                />
              </label>
              <label className="block flex-1 text-sm">
                <span className="mb-1 block font-medium text-slate-300">Time</span>
                <input
                  type="time"
                  step={60}
                  value={splitDateTime(values.expiry_time).clock}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      expiry_time: mergeDateTime(
                        splitDateTime(v.expiry_time).date,
                        e.target.value
                      ),
                    }))
                  }
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30"
                />
              </label>
            </div>
          </div>
          {errors.expiry_time && (
            <span className="block text-xs text-rose-300">{errors.expiry_time}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Create signal"}
          </button>
          <p className="text-xs text-slate-500">
            Server validates BUY/SELL constraints and expiry ordering.
          </p>
        </div>
      </form>
    </section>
  );
}
