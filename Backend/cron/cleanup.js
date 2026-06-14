import cron from 'node-cron';
import { prisma } from "../lib/prisma.js";

export const startCleanupJob = () => {
    const cleanup = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = await prisma.reservation.deleteMany({
                where: { bookingDate: { lt: today } }
            });

            if (result.count > 0) {
                console.log(`Oude reserveringen opgeruimd: ${result.count}`);
            }
        } catch (err) {
            console.error('Fout bij het verwijderen van oude reserveringen:', err);
        }
    };

    cleanup();
    cron.schedule('0 0 * * *', cleanup);
};
