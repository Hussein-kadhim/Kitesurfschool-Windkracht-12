import { prisma } from "../../lib/prisma.js";

export const updateUser = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const { id } = req.params;
        const { name, email, role, address, city, dateOfBirth, phone, bsn, isBlocked } = req.body;

        // Alleen eigenaar mag de rol wijzigen
        const finalRole = req.user.role === 'instructeur' ? undefined : role;

        // Determine BSN: only for non-klant roles
        const resolvedRole = finalRole ?? (await prisma.user.findUnique({ where: { id: parseInt(id) }, select: { role: true } }))?.role;
        const finalBsn = resolvedRole === 'klant' ? null : (bsn || null);

        // Alleen eigenaar mag blokkeren/deblokkeren, en een eigenaar kan niet geblokkeerd worden
        let finalIsBlocked = undefined;
        if (req.user.role === 'eigenaar' && isBlocked !== undefined) {
            if (resolvedRole === 'eigenaar') {
                finalIsBlocked = false; // Force false for eigenaar
            } else {
                finalIsBlocked = isBlocked;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name:        name        || undefined,
                email:       email       || undefined,
                role:        finalRole,
                address:     address     ?? null,
                city:        city        ?? null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone:       phone       ?? null,
                bsn:         finalBsn,
                isBlocked:   finalIsBlocked,
            },
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
                isBlocked: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Fout bij bijwerken gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet bijwerken" });
    }
};

// Dedicated endpoint: klant → instructeur
export const promoteToInstructeur = async (req, res) => {
    if (req.user.role !== 'eigenaar') {
        return res.status(403).json({ message: "Alleen de eigenaar kan gebruikers promoveren" });
    }
    try {
        const { id } = req.params;

        const target = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!target) return res.status(404).json({ message: "Gebruiker niet gevonden" });
        if (target.role !== 'klant') {
            return res.status(400).json({ message: "Gebruiker is al geen klant meer" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role: 'instructeur' },
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
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Fout bij promoveren gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet promoveren" });
    }
};
