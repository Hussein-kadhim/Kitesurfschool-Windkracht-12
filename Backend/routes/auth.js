import express from "express";
import { protect } from "../middleware/auth.js";
import { 
    register, 
    login, 
    logout, 
    getMe, 
    forgotPassword, 
    resetPassword,
    updateProfile,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    verifyEmail
} from "../controllers/auth.js";

const router = express.Router();

// Registeren
router.post("/register", register)

// Email Verification
router.post("/verify", verifyEmail)

// Login
router.post("/login", login)

// Me
router.get("/me", protect, getMe)

// Logout (Protected to log user information)
router.post("/logout", protect, logout)

// Wachtwoord Vergeten
router.post("/forgot-password", forgotPassword);

// Wachtwoord Resetten
router.post("/reset-password", resetPassword);

// Profile (Self)
router.put("/profile", protect, updateProfile);

// User Administration
router.get("/users", protect, getAllUsers);
router.post("/users", protect, createUser);
router.put("/users/:id", protect, updateUser);
router.delete("/users/:id", protect, deleteUser);

export default router;
