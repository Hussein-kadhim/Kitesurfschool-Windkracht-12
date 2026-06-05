import express from "express";
import { protect } from "../middleware/auth.js";
import { getAllReservations } from "../controllers/reservation/read.js";
import { createReservation } from "../controllers/reservation/create.js";
import { updateReservation } from "../controllers/reservation/update.js";
import { deleteReservation } from "../controllers/reservation/delete.js";

const router = express.Router();

// Alle reserveringen ophalen
router.get("/", protect, getAllReservations);

// Nieuwe reservering maken
router.post("/", protect, createReservation);

// Reservering bijwerken
router.put("/:id", protect, updateReservation);

// Reservering verwijderen
router.delete("/:id", protect, deleteReservation);

export default router;