import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const LESSON_LABELS = {
  PRIVE_LES: 'Privéles',
  DUO_LES: 'Losse Duo Kiteles',
  GROEPSLES: 'Duo Lespakket 3 Lessen',
  GROEPSLES_5_LESSEN: 'Duo Lespakket 5 Lessen',
};

export const updateReservation = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Je moet ingelogd zijn om je reservering te wijzigen" });

    try {
        const { id } = req.params;
        const { bookingDate, status } = req.body;

        // Haal de reservering + gebruiker op
        const bestaand = await prisma.reservation.findUnique({
            where: { id: parseInt(id) },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!bestaand)
            return res.status(404).json({ message: "Reservering niet gevonden" });

        // Klant mag alleen eigen reservering wijzigen; eigenaar mag alles
        if (req.user.role !== "eigenaar" && bestaand.userId !== req.user.id)
            return res.status(403).json({ message: "Je bent niet gemachtigd om dit te doen" });

        const updateData = {};

        if (bookingDate) {
            const parsedDate = new Date(bookingDate);
            if (isNaN(parsedDate.getTime()))
                return res.status(400).json({ message: "Ongeldige datum" });
            updateData.bookingDate = parsedDate;
        }

        if (status) {
            const geldige = ["VOORLOPIG", "DEFINITIEF", "GEANNULEERD"];
            if (!geldige.includes(status))
                return res.status(400).json({ message: "Ongeldige status" });
            updateData.status = status;
        }

        const reservation = await prisma.reservation.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Stuur bevestigingsmail als datum is gewijzigd
        if (bookingDate) {
            const lesNaam = LESSON_LABELS[bestaand.lesson] || bestaand.lesson;
            const oudeDatum = new Date(bestaand.bookingDate).toLocaleDateString('nl-NL', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            });
            const nieuweDatum = new Date(updateData.bookingDate).toLocaleDateString('nl-NL', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            });

            try {
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: bestaand.user.email,
                    subject: 'Reservering gewijzigd - Kitesurfschool Windkracht-12',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #111;">Reservering gewijzigd</h2>
                            <p>Beste ${bestaand.user.name},</p>
                            <p>De datum van je reservering is succesvol gewijzigd. Hieronder vind je de bijgewerkte gegevens.</p>
                            <div style="background-color: #f5f5f0; padding: 15px; margin: 20px 0; border-left: 4px solid #111;">
                                <h3 style="margin-top: 0; color: #111;">Gewijzigde reservering</h3>
                                <ul style="list-style: none; padding-left: 0; margin: 0;">
                                    <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                                    <li style="margin-bottom: 8px;"><strong>Oude datum:</strong> <span style="text-decoration: line-through; color: #999;">${oudeDatum}</span></li>
                                    <li style="margin-bottom: 8px;"><strong>Nieuwe datum:</strong> ${nieuweDatum}</li>
                                    <li style="margin-bottom: 8px;"><strong>Bedrag:</strong> €${bestaand.price.toFixed(2)}</li>
                                </ul>
                            </div>
                            <p>Heb je vragen? Neem dan contact met ons op.</p>
                            <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Fout bij verzenden wijzigingsmail:", emailError);
            }
        }

        res.json(reservation);
    } catch (error) {
        console.error("Fout bij bijwerken reservering:", error);
        res.status(500).json({ message: "Server fout bij bijwerken van reservering" });
    }
}