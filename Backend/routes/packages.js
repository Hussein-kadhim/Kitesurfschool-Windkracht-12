import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const packages = await prisma.package.findMany({
            orderBy: {
                id: "asc"
            }
        });
        res.json(packages);
    } catch (error) {
        console.error("Fout bij ophalen pakketten:", error);
        res.status(500).json({ message: "Server fout bij ophalen van pakketten" });
    }
});

export default router;
