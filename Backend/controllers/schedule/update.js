import { prisma } from "../../lib/prisma.js";

export const updateSchedule = async (req, res) => {
    if (req.user.role !== 'eigenaar') {
        return res.status(403).json({ message: "Geen toegang" });
    }

    try {
        const { id } = req.params;
        const { date, time, instructorId, maxPersons } = req.body;

        const schedule = await prisma.lessonSchedule.findUnique({
            where: { id: parseInt(id) }
        });

        if (!schedule) {
            return res.status(404).json({ message: "Les-slot niet gevonden" });
        }

        const parsedDate = new Date(date);

        // Check if instructor is already booked for this new date and time
        const existingSchedule = await prisma.lessonSchedule.findFirst({
            where: {
                date: parsedDate,
                time: time,
                instructorId: parseInt(instructorId),
                id: { not: parseInt(id) } // exclude current
            }
        });

        if (existingSchedule) {
            return res.status(400).json({ message: "Instructeur is dan al ingepland" });
        }

        const updated = await prisma.lessonSchedule.update({
            where: { id: parseInt(id) },
            data: {
                date: parsedDate,
                time,
                instructorId: parseInt(instructorId),
                maxPersons: maxPersons ? parseInt(maxPersons) : 2
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Fout bij updaten les-slot:", error);
        res.status(500).json({ message: "Kon het les-slot niet updaten" });
    }
};
