import { useCallback, useState } from "react";
import SignalForm from "../components/SignalForm.jsx";
import SignalsTable from "../components/SignalsTable.jsx";
import { useSignals } from "../hooks/useSignals.js";
import { useNow } from "../hooks/useNow.js";
import { signalsApi } from "../services/api.js";

export default function DashboardPage() {
  const { signals, loading, error, refetch } = useSignals();
  const now = useNow(1000);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = useCallback((message, variant = "success") => {
    setToast({ message, variant });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const onCreated = useCallback(() => {
    showToast("Signal created successfully.");
    void refetch();
  }, [refetch, showToast]);

  const onSymbolUpdated = useCallback(() => {
    showToast("Symbol updated.");
    void refetch();
  }, [refetch, showToast]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this signal permanently?")) {
        return;
      }
      setDeletingId(id);
      try {
        await signalsApi.remove(id);
        showToast("Signal removed.");
        await refetch();
      } catch (e) {
        showToast(e.message ?? "Delete failed.", "error");
      } finally {
        setDeletingId(null);
      }
    },
    [refetch, showToast]
  );

  return (
    <div className="flex flex-col gap-8">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            toast.variant === "error"
              ? "border-rose-500/40 bg-rose-950/90 text-rose-50"
              : "border-emerald-500/40 bg-emerald-950/90 text-emerald-50"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <SignalForm onCreated={onCreated} />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Dashboard</h2>
            <p className="text-sm text-slate-400">
              Auto-refresh every 15s · Binance prices are fetched on the server (your
              Network tab only shows calls to this app’s API)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex self-start rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 sm:mt-0"
          >
            Refresh now
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 px-6 py-16 text-center text-slate-400">
            Loading signals…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-8 text-center text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && signals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 px-6 py-16 text-center text-slate-400">
            No signals yet. Create one above to populate this table.
          </div>
        )}

        {!loading && !error && signals.length > 0 && (
          <SignalsTable
            signals={signals}
            now={now}
            deletingId={deletingId}
            onDelete={handleDelete}
            onSymbolUpdated={onSymbolUpdated}
          />
        )}
      </section>
    </div>
  );
}
