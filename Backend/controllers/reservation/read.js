import { prisma } from "../../lib/prisma.js";

export const getAllReservations = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om reserveringen in te zien" });
    }

    try {
        const reservations = await prisma.reservation.findMany({
            where: { userId: req.user.id },
            orderBy: {
                bookingDate: "asc"
            }
        });
        res.json(reservations);
    } catch (error) {
        console.error("Fout bij ophalen reserveringen:", error);
        res.status(500).json({ message: "Server fout bij ophalen van reserveringen" });
    }
}