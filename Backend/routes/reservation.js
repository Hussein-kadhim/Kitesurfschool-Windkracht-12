import express from "express";
import { protect } from "../middleware/auth.js";
import { getAllReservations } from "../controllers/reservation/read.js";
import { createReservation } from "../controllers/reservation/create.js";
import { updateReservation } from "../controllers/reservation/update.js";
import { deleteReservation } from "../controllers/reservation/delete.js";

const router = express.Router();

// Reservations
router.get("/", protect, getAllReservations);
router.post("/", protect, createReservation);
router.put("/:id", protect, updateReservation);
router.delete("/:id", protect, deleteReservation);

export default router;