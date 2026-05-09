/**
 * Maps Prisma model to plain JSON-friendly object.
 */
export function toSignalDto(signal, enrich = {}) {
  const dto = {
    id: signal.id,
    symbol: signal.symbol,
    direction: signal.direction,
    entry_price: signal.entry_price.toString(),
    stop_loss: signal.stop_loss.toString(),
    target_price: signal.target_price.toString(),
    entry_time: signal.entry_time.toISOString(),
    expiry_time: signal.expiry_time.toISOString(),
    created_at: signal.created_at.toISOString(),
    status: signal.status,
    realized_roi:
      signal.realized_roi != null ? Number(signal.realized_roi) : null,
  };

  if (Object.prototype.hasOwnProperty.call(enrich, "currentPrice")) {
    dto.current_price = enrich.currentPrice;
  }
  if (Object.prototype.hasOwnProperty.call(enrich, "roiPercent")) {
    dto.roi_percent = enrich.roiPercent;
  }
  if (enrich.binanceError) {
    dto.price_error = enrich.binanceError;
  }

  return dto;
}
