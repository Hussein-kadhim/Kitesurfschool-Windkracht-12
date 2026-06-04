import { prisma } from "../../lib/prisma.js";


export const updateReservation = async (req, res) => {
    if(!req.user) return res.status(401).json({message: "Je moet ingelogd zijn om je reservering te wijzigen"});
    
    try {
        const { id } = req.params;
        const { bookingDate } = req.body;


        const parsedDate = new Date(bookingDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({message: "Ongeldige datum"});
        }

        const reservation = await prisma.reservation.update({
            where: {id: parseInt(id)},
            data: {
                bookingDate: parsedDate,
            }
        });

        res.json(reservation);
    } catch (error) {
        console.error("Fout bij bijwerken reservering:", error);
        res.status(500).json({ message: "Server fout bij bijwerken van reservering" });
    }
}