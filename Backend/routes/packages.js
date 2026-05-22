import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM packages ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Fout bij ophalen pakketten:", error);
        res.status(500).json({ message: "Server fout bij ophalen van pakketten" });
    }
});

export default router;
