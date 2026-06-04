import express from "express";
import { protect } from "../middleware/auth.js";
import { register, login, logout, getMe, forgotPassword, resetPassword } from "../controllers/auth.js";

const router = express.Router();

// Registeren
router.post("/register", register)

// Login
router.post("/login", login)

// Me
router.get("/me", protect, getMe)

// Logout
router.post("/logout", logout)

// Wachtwoord Vergeten
router.post("/forgot-password", forgotPassword);

// Wachtwoord Resetten
router.post("/reset-password", resetPassword);

export default router;
