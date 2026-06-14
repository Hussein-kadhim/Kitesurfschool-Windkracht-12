import { prisma } from "../../lib/prisma.js";

export const getAllReservations = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om reserveringen in te zien" });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservations = await prisma.reservation.findMany({
            where: { 
                userId: req.user.id,
                bookingDate: {
                    gte: today
                }
            },
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