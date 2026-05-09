import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400/90">
              Live markets
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Trading Signal Tracker
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Create signals, track Binance prices, and monitor status with ROI
              and expiry in one place.
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <DashboardPage />
      </main>
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Data from Binance public API. Not financial advice.
      </footer>
    </div>
  );
}
