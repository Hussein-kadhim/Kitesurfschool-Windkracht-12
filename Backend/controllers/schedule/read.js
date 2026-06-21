import { prisma } from "../../lib/prisma.js";

export const getSchedules = async (req, res) => {
    try {
        let schedules;
        
        const now = new Date();
        now.setHours(0,0,0,0);

        if (req.user.role === 'eigenaar') {
            schedules = await prisma.lessonSchedule.findMany({
                where: { date: { gte: now } },
                include: { instructor: { select: { name: true, email: true } } },
                orderBy: { date: 'asc' }
            });
        } else if (req.user.role === 'instructeur') {
            schedules = await prisma.lessonSchedule.findMany({
                where: { instructorId: req.user.id, date: { gte: now } },
                include: { instructor: { select: { name: true, email: true } } },
                orderBy: { date: 'asc' }
            });
        } else if (req.user.role === 'klant') {
            schedules = await prisma.lessonSchedule.findMany({
                where: { date: { gte: now } },
                include: { instructor: { select: { name: true } } },
                orderBy: { date: 'asc' }
            });
        } else {
            return res.status(403).json({ message: "Geen toegang" });
        }

        // Haal reserveringen op om de capaciteit te berekenen en klantinfo te tonen
        const reservations = await prisma.reservation.findMany({
            where: { status: { not: 'GEANNULEERD' } },
            select: { 
                id: true,
                bookingDate: true, 
                instructorId: true, 
                duoName: true,
                status: true,
                hasPaid: true,
                user: { select: { name: true, email: true } }
            }
        });

        // Voeg bookedCount en reservations toe aan elke schedule
        const schedulesWithCount = schedules.map(schedule => {
            // Zoek reserveringen voor dezelfde datum en instructeur
            const relatedReservations = reservations.filter(res => {
                return res.instructorId === schedule.instructorId && 
                       new Date(res.bookingDate).toDateString() === new Date(schedule.date).toDateString();
            });

            // Tel het aantal personen (1 voor privé, 2 voor duo)
            let bookedCount = 0;
            relatedReservations.forEach(res => {
                bookedCount += (res.duoName && res.duoName.trim() !== '') ? 2 : 1;
            });

            return {
                ...schedule,
                bookedCount,
                reservations: req.user.role === 'eigenaar' || req.user.role === 'instructeur' ? relatedReservations : []
            };
        });

        res.json({ schedules: schedulesWithCount });
    } catch (error) {
        console.error("Fout bij ophalen agenda:", error);
        res.status(500).json({ message: "Kon agenda niet ophalen" });
    }
};
