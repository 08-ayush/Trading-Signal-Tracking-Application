import { Router } from "express";
import * as signalController from "../controllers/signal.controller.js";

const router = Router();

router.post("/", signalController.createSignal);
router.get("/", signalController.listSignals);
router.get("/:id/status", signalController.getSignalStatus);
router.patch("/:id", signalController.patchSignal);
router.get("/:id", signalController.getSignalById);
router.delete("/:id", signalController.deleteSignal);

export default router;
