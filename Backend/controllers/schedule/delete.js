import { prisma } from "../../lib/prisma.js";
import { sendEmail } from "../../lib/mailer.js";

export const deleteSchedule = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Geen toegang" });
    }

    try {
        const { id } = req.params;
        const { reason } = req.query; // 'ziekte' of 'weer'

        const schedule = await prisma.lessonSchedule.findUnique({
            where: { id: parseInt(id) },
            include: { instructor: true }
        });

        if (!schedule) {
            return res.status(404).json({ message: "Les-slot niet gevonden" });
        }

        // Instructeur mag alleen z'n eigen lessen annuleren
        if (req.user.role === 'instructeur' && schedule.instructorId !== req.user.id) {
             return res.status(403).json({ message: "Je mag alleen je eigen lessen annuleren" });
        }

        // Vind de reserveringen die gekoppeld zijn aan dit lesmoment
        const startOfDay = new Date(schedule.date);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(schedule.date);
        endOfDay.setHours(23,59,59,999);

        const reservationsToCancel = await prisma.reservation.findMany({
             where: {
                 instructorId: schedule.instructorId,
                 bookingDate: {
                     gte: startOfDay,
                     lte: endOfDay
                 },
                 status: { not: 'GEANNULEERD' }
             },
             include: { user: true }
        });

        if (reason === 'ziekte' || reason === 'weer') {
             // Update status naar GEANNULEERD
             for (const resData of reservationsToCancel) {
                 await prisma.reservation.update({
                      where: { id: resData.id },
                      data: { 
                          status: 'GEANNULEERD',
                          cancelReason: reason === 'ziekte' ? 'Ziekte van instructeur' : 'Slechte weersomstandigheden (windkracht > 10)',
                          cancelApproved: true 
                      }
                 });
             }

             // Stuur emails
             try {
                 const redenText = reason === 'ziekte' 
                     ? "Ziekte van de instructeur" 
                     : "Slechte weersomstandigheden (windkracht > 10)";
                     
                 const dateStr = startOfDay.toLocaleDateString('nl-NL');

                 const sentEmails = new Set();

                 for (const resData of reservationsToCancel) {
                     if (!resData.user.email) continue;
                     if (sentEmails.has(resData.user.email)) continue;
                     
                     sentEmails.add(resData.user.email);
                     
                     await sendEmail({
                         to: resData.user.email,
                         subject: 'Belangrijk: Je Kitesurfles is geannuleerd',
                         html: `
                           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                             <h2 style="color: #D32F2F;">Les Geannuleerd</h2>
                             <p>Beste ${resData.user.name || 'kitesurfer'},</p>
                             <p>Helaas moeten we je kitesurfles van <strong>${dateStr}</strong> om <strong>${schedule.time}</strong> annuleren.</p>
                             <p><strong>Reden:</strong> ${redenText}</p>
                             <p><strong>Instructeur:</strong> ${schedule.instructor?.name || schedule.instructor?.email}</p>
                             <p>Je kunt via je dashboard kosteloos een nieuwe les inplannen of contact met ons opnemen voor een restitutie als je al betaald had.</p>
                             <p>Onze excuses voor het ongemak.</p>
                             <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
                           </div>
                         `
                     });
                 }

                 // Mail naar eigenaar(en)
                 const eigenaren = await prisma.user.findMany({ where: { role: 'eigenaar' } });
                 for (const eigenaar of eigenaren) {
                     if (eigenaar.email) {
                         await sendEmail({
                             to: eigenaar.email,
                             subject: 'Systeem: Lesrooster Geannuleerd',
                             html: `
                               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                 <h2 style="color: #D32F2F;">Les-slot Geannuleerd</h2>
                                 <p>Beste ${eigenaar.name || 'Eigenaar'},</p>
                                 <p>Er is zojuist een gepland les-slot geannuleerd.</p>
                                 <p><strong>Reden:</strong> ${redenText}</p>
                                 <p><strong>Instructeur:</strong> ${schedule.instructor?.name || schedule.instructor?.email}</p>
                                 <p><strong>Datum & Tijd:</strong> ${dateStr} om ${schedule.time}</p>
                                 <p>De getroffen klanten hebben automatisch een e-mail ontvangen.</p>
                               </div>
                             `
                         });
                     }
                 }

                 // Mail naar de instructeur zelf ter bevestiging
                 if (schedule.instructor && schedule.instructor.email) {
                     await sendEmail({
                         to: schedule.instructor.email,
                         subject: 'Bevestiging: Je hebt een les-slot geannuleerd',
                         html: `
                           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                             <h2 style="color: #D32F2F;">Les-slot Succesvol Geannuleerd</h2>
                             <p>Beste ${schedule.instructor.name || 'Instructeur'},</p>
                             <p>Je hebt zojuist succesvol je ingeplande les-slot geannuleerd.</p>
                             <p><strong>Reden:</strong> ${redenText}</p>
                             <p><strong>Datum & Tijd:</strong> ${dateStr} om ${schedule.time}</p>
                             <p>Alle klanten die op dit tijdstip geboekt stonden, zijn automatisch via e-mail op de hoogte gebracht en de reserveringen zijn uit de agenda gehaald. Ook de beheerder is op de hoogte gebracht.</p>
                             <p>Met vriendelijke groet,<br><br><strong>Systeem Windkracht-12</strong></p>
                           </div>
                         `
                     });
                 }
             } catch (emailError) {
                 console.error("Fout bij verzenden annuleringsmails:", emailError);
             }
        }

        // Nu de schedule zelf verwijderen
        await prisma.lessonSchedule.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: "Les slot succesvol verwijderd en klanten op de hoogte gesteld." });
    } catch (error) {
        console.error("Fout bij verwijderen les slot:", error);
        res.status(500).json({ message: "Kon het les slot niet verwijderen" });
    }
};
