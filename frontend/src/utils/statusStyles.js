export function statusBadgeClass(status) {
  switch (status) {
    case "OPEN":
      return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/40";
    case "TARGET_HIT":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40";
    case "STOPLOSS_HIT":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40";
    case "EXPIRED":
      return "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40";
    default:
      return "bg-slate-700/40 text-slate-200 ring-1 ring-slate-600/40";
  }
}
