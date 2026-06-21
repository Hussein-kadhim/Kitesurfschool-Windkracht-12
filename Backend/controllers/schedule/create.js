import { prisma } from "../../lib/prisma.js";

export const createSchedule = async (req, res) => {
    try {
        const { date, time, instructorId, maxPersons } = req.body;

        if (req.user.role !== 'eigenaar') {
            return res.status(403).json({ message: "Alleen de eigenaar kan lessen inplannen" });
        }

        if (!date || !time || !instructorId) {
            return res.status(400).json({ message: "Datum, tijd en instructeur zijn verplicht" });
        }

        const targetDate = new Date(date);
        
        // Unhappy scenario: Check if instructor is already booked for this date and time
        const existingSchedule = await prisma.lessonSchedule.findFirst({
            where: {
                date: targetDate,
                time: time,
                instructorId: parseInt(instructorId)
            }
        });

        if (existingSchedule) {
            return res.status(400).json({ message: "Instructeur niet beschikbaar" });
        }

        const schedule = await prisma.lessonSchedule.create({
            data: {
                date: targetDate,
                time,
                instructorId: parseInt(instructorId),
                maxPersons: maxPersons ? parseInt(maxPersons) : 2
            },
            include: {
                instructor: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json({ message: "Les succesvol ingepland", schedule });
    } catch (error) {
        console.error("Fout bij inplannen les:", error);
        res.status(500).json({ message: "Kon les niet inplannen" });
    }
};
