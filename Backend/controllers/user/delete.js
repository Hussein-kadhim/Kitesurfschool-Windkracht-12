import { prisma } from "../../lib/prisma.js";

export const deleteUser = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Alleen de eigenaar of instructeur kan gebruikers verwijderen" });
    }
    try {
        const { id } = req.params;
        const targetUserId = parseInt(id);

        // Bescherm: eigenaar kan zichzelf niet verwijderen
        if (targetUserId === req.user.id) {
            return res.status(400).json({ message: "Je kunt je eigen account niet verwijderen" });
        }

        const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
        if (!target) return res.status(404).json({ message: "Gebruiker niet gevonden" });

        // Instructeur mag alleen klanten verwijderen
        if (req.user.role === 'instructeur' && target.role !== 'klant') {
            return res.status(403).json({ message: "Je mag alleen klanten verwijderen" });
        }

        // Bescherm: eigenaar accounts kunnen nooit verwijderd worden
        if (target.role === 'eigenaar') {
            return res.status(400).json({ message: "Eigenaar accounts kunnen niet verwijderd worden" });
        }

        // Verwijder eerst reserveringen van deze gebruiker (foreign key)
        await prisma.reservation.deleteMany({
            where: { userId: targetUserId }
        });

        // Ontkoppel instructeur van lessen die hij gaf
        await prisma.reservation.updateMany({
            where: { instructorId: targetUserId },
            data: { instructorId: null }
        });

        await prisma.user.delete({
            where: { id: targetUserId }
        });

        res.json({ message: "Gebruiker succesvol verwijderd" });
    } catch (error) {
        console.error("Fout bij verwijderen gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet verwijderen" });
    }
};
