import { prisma } from "../../lib/prisma.js";

export const getAllReservations = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om reserveringen in te zien" });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let whereClause = {
            bookingDate: { gte: today }
        };

        if (req.user.role === 'user') {
            whereClause.userId = req.user.id;
        } else if (req.user.role === 'instructeur') {
            whereClause.instructorId = req.user.id;
        }
        // Eigenaar ziet alles, dus we voegen geen userId filter toe

        const reservations = await prisma.reservation.findMany({
            where: whereClause,
            orderBy: {
                bookingDate: "asc"
            },
            include: { 
              instructor: { select: { name: true, email: true } },
              user: { select: { name: true, email: true } }
            }
        });
        res.json(reservations);
    } catch (error) {
        console.error("Fout bij ophalen reserveringen:", error);
        res.status(500).json({ message: "Server fout bij ophalen van reserveringen" });
    }
}

export const getReservationById = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om deze reservering in te zien" });
    }

    try {
        const { id } = req.params;
        const reservation = await prisma.reservation.findUnique({
            where: { id: parseInt(id) }
        });

        if (!reservation) {
            return res.status(404).json({ message: "Reservering niet gevonden" });
        }

        // Klant mag alleen eigen reservering zien, eigenaar mag alles zien
        if (req.user.role !== "eigenaar" && reservation.userId !== req.user.id) {
            return res.status(403).json({ message: "Geen toegang tot deze reservering" });
        }

        res.json(reservation);
    } catch (error) {
        console.error("Fout bij ophalen reservering:", error);
        res.status(500).json({ message: "Server fout bij ophalen van reservering" });
    }
}