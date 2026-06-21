import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js"
import packagesRoutes from "./routes/packages.js"
import reservationRoutes from "./routes/reservation.js"
import gebruikersRoutes from "./routes/users.js"
import scheduleRoutes from "./routes/schedule.js"
import { startCleanupJob } from "./cron/cleanup.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/gebruikers", gebruikersRoutes);
app.use("/api/schedule", scheduleRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start de automatische opschoning voor verlopen afspraken
    startCleanupJob();
});

// Trigger reload
