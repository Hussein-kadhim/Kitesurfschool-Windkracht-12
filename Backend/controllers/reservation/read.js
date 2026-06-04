import { prisma } from "../../lib/prisma.js";

export const getAllReservations = async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                bookingDate: "desc"
            }
        });
        res.json(reservations);
    } catch (error) {
        console.error("Fout bij ophalen reserveringen:", error);
        res.status(500).json({ message: "Server fout bij ophalen van reserveringen" });
    }
}