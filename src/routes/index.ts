import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Backend reset complete. Start implementing routes." });
});

export default router;
