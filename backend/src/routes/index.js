import { Router } from "express";
import signalRoutes from "./signal.routes.js";

const router = Router();

router.use("/signals", signalRoutes);

export default router;
