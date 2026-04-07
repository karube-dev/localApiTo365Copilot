import { Router, Request, Response } from "express";
import type { ModelsResponse } from "../types/openai.js";

const router = Router();

/**
 * Returns a static list of models that this proxy exposes.
 * The single model "copilot-365" represents the M365 Copilot Chat backend.
 */
router.get("/", (_req: Request, res: Response): void => {
  const response: ModelsResponse = {
    object: "list",
    data: [
      {
        id: "copilot-365",
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "microsoft",
      },
    ],
  };
  res.json(response);
});

export default router;
