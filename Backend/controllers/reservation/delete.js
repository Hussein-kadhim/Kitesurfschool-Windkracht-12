import "dotenv/config";
import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const LESSON_LABELS = {
  PRIVE_LES:     'Privéles',
  LOSSE_DUO_LES: 'Losse Duo Kiteles',
  DUO_PAKKET_3:  'Duo Lespakket 3 Lessen',
  DUO_PAKKET_5:  'Duo Lespakket 5 Lessen',
};

export const deleteReservation = async (req, res) => {
  if (!req.user)
    return res.status(401).json({ message: "Je moet ingelogd zijn om je reservering te annuleren" });

  if (!req.params?.id)
    return res.status(400).json({ message: "Geen reservering ID opgegeven" });

  try {
    const { id } = req.params;

    // Haal de reservering + gebruiker op voor de email
    const reservering = await prisma.reservation.findUnique({
      where: { id: parseInt(id) },
      include: { 
        user: { select: { name: true, email: true } },
        instructor: { select: { name: true, email: true } }
      },
    });

    if (!reservering)
      return res.status(404).json({ message: "Reservering niet gevonden" });

    // Klant mag alleen eigen reservering verwijderen; eigenaar mag alles
    if (req.user.role !== "eigenaar" && reservering.userId !== req.user.id)
      return res.status(403).json({ message: "Je bent niet gemachtigd om dit te doen" });

    // Verwijder de reservering
    await prisma.reservation.delete({
      where: { id: parseInt(id) },
    });

    // Stuur annuleringsmail naar de klant
    const lesNaam = LESSON_LABELS[reservering.lesson] || reservering.lesson;
    const datum = new Date(reservering.bookingDate).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: reservering.user.email,
        subject: 'Annulering bevestigd - Kitesurfschool Windkracht-12',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #111;">Annulering bevestigd</h2>
            <p>Beste ${reservering.user.name},</p>
            <p>Je reservering is succesvol geannuleerd. Hieronder vind je de details van de geannuleerde boeking.</p>
            <div style="background-color: #f5f5f0; padding: 15px; margin: 20px 0; border-left: 4px solid #111;">
              <h3 style="margin-top: 0; color: #111;">Geannuleerde reservering</h3>
              <ul style="list-style: none; padding-left: 0; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${datum}</li>
                <li style="margin-bottom: 8px;"><strong>Bedrag:</strong> €${reservering.price.toFixed(2)}</li>
              </ul>
            </div>
            <p>Wil je een nieuwe les boeken? Ga naar onze website en bekijk de beschikbare pakketten.</p>
            <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Fout bij verzenden annuleringsmail naar klant:", emailError);
      // Email fout stopt de annulering niet
    }

    // Stuur annuleringsmail naar de instructeur (als er een is)
    if (reservering.instructor?.email) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: reservering.instructor.email,
          subject: `Reservering verwijderd - Klant: ${reservering.user.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #111;">Reservering Verwijderd</h2>
              <p>Beste ${reservering.instructor.name},</p>
              <p>Klant <strong>${reservering.user.name}</strong> heeft de les zojuist geannuleerd/verwijderd.</p>
              <div style="background-color: #f5f5f0; padding: 15px; margin: 20px 0; border-left: 4px solid #111;">
                <ul style="list-style: none; padding-left: 0; margin: 0;">
                  <li style="margin-bottom: 8px;"><strong>Klant:</strong> ${reservering.user.name}</li>
                  <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                  <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${datum}</li>
                </ul>
              </div>
              <p>Met vriendelijke groet,<br><br><strong>Systeem Windkracht-12</strong></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Fout bij verzenden annuleringsmail naar instructeur:", emailError);
      }
    }

    res.json({ message: "Reservering succesvol geannuleerd!" });
  } catch (error) {
    console.error("Fout bij annuleren reservering:", error);
    res.status(500).json({ message: "Server fout bij annuleren van reservering" });
  }
};
