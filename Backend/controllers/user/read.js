import { prisma } from "../../lib/prisma.js";

export const getAllUsers = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const whereClause = req.user.role === 'instructeur' ? { role: 'klant' } : {};
        
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                address: true,
                city: true,
                dateOfBirth: true,
                phone: true,
                bsn: true,
                isVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error("Fout bij ophalen gebruikers:", error);
        res.status(500).json({ message: "Kon gebruikers niet ophalen" });
    }
};

export const getUserById = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                address: true,
                city: true,
                dateOfBirth: true,
                phone: true,
                bsn: true,
                isVerified: true,
                createdAt: true,
                reservations: {
                    select: {
                        id: true,
                        lesson: true,
                        bookingDate: true,
                        status: true,
                        price: true,
                        hasPaid: true,
                    },
                    orderBy: { bookingDate: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }

        res.json(user);
    } catch (error) {
        console.error("Fout bij ophalen gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet ophalen" });
    }
};
