import express from "express";
import { protect } from "../middleware/auth.js";
import { getAllUsers, getUserById } from "../controllers/user/read.js";
import { createUser } from "../controllers/user/create.js";
import { updateUser, promoteToInstructeur } from "../controllers/user/update.js";
import { deleteUser } from "../controllers/user/delete.js";

const router = express.Router();

// Alle gebruikers ophalen
router.get("/", protect, getAllUsers);

// Specifieke gebruiker ophalen
router.get("/:id", protect, getUserById);

// Nieuwe gebruiker aanmaken (eigenaar only)
router.post("/", protect, createUser);

// Gebruiker bijwerken
router.put("/:id", protect, updateUser);

// Gebruiker promoveren naar instructeur (eigenaar only)
router.patch("/:id/promote", protect, promoteToInstructeur);

// Gebruiker verwijderen (eigenaar only)
router.delete("/:id", protect, deleteUser);

export default router;
