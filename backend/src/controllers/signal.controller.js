import { asyncHandler } from "../utils/asyncHandler.js";
import * as signalService from "../services/signal.service.js";

export const createSignal = asyncHandler(async (req, res) => {
  const data = await signalService.createSignal(req.body);
  res.status(201).json({ success: true, data });
});

export const listSignals = asyncHandler(async (req, res) => {
  const data = await signalService.listSignalsWithRefresh();
  res.json({ success: true, data });
});

export const getSignalById = asyncHandler(async (req, res) => {
  const data = await signalService.getSignalByIdWithRefresh(req.params.id);
  res.json({ success: true, data });
});

export const patchSignal = asyncHandler(async (req, res) => {
  const data = await signalService.patchOpenSignalSymbol(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteSignal = asyncHandler(async (req, res) => {
  await signalService.deleteSignalById(req.params.id);
  res.status(204).send();
});

export const getSignalStatus = asyncHandler(async (req, res) => {
  const payload = await signalService.getSignalStatusById(req.params.id);
  res.json({ success: true, ...payload });
});
