import "dotenv/config";
import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const LESSON_LABELS = {
  PRIVE_LES: 'Privéles',
  LOSSE_DUO_LES: 'Losse Duo Kiteles',
  DUO_PAKKET_3: 'Duo Lespakket 3 Lessen',
  DUO_PAKKET_5: 'Duo Lespakket 5 Lessen',
};

export const cancelNotify = async (req, res) => {
    // Alleen eigenaar of instructeur mag dit uitvoeren
    if (!req.user || (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur')) {
        return res.status(403).json({ message: "Geen toestemming." });
    }

    const { id } = req.params;
    const { type } = req.body; // "ziekte" of "slecht_weer"

    if (!type || !['ziekte', 'slecht_weer'].includes(type)) {
        return res.status(400).json({ message: "Type moet 'ziekte' of 'slecht_weer' zijn." });
    }

    try {
        const reservering = await prisma.reservation.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true } },
                instructor: { select: { name: true, email: true } },
            },
        });

        if (!reservering) {
            return res.status(404).json({ message: "Reservering niet gevonden." });
        }

        const lesNaam = LESSON_LABELS[reservering.lesson] || reservering.lesson;
        const datum = new Date(reservering.bookingDate).toLocaleDateString('nl-NL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
        const instructeurNaam = reservering.instructor?.name || req.user.name || 'Uw instructeur';

        let subject, reden, intro;

        if (type === 'ziekte') {
            subject = 'Kitesurles geannuleerd wegens ziekte - Windkracht-12';
            reden = 'ziekte van de instructeur';
            intro = `Tot onze spijt moeten wij je mededelen dat de onderstaande les geannuleerd is wegens ziekte van instructeur <strong>${instructeurNaam}</strong>.`;
        } else {
            subject = 'Kitesurles geannuleerd wegens slecht weer - Windkracht-12';
            reden = 'slechte weersomstandigheden (windkracht > 10)';
            intro = `Tot onze spijt moeten wij je mededelen dat de onderstaande les geannuleerd is wegens slechte weersomstandigheden (windkracht hoger dan 10). Dit is uit veiligheidsoverwegingen.`;
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #c0392b;">Les geannuleerd</h2>
                <p>Beste ${reservering.user.name},</p>
                <p>${intro}</p>
                <div style="background-color: #fff5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #c0392b;">
                    <h3 style="margin-top: 0; color: #c0392b;">Geannuleerde les</h3>
                    <ul style="list-style: none; padding-left: 0; margin: 0;">
                        <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                        <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${datum}</li>
                        <li style="margin-bottom: 8px;"><strong>Instructeur:</strong> ${instructeurNaam}</li>
                        <li style="margin-bottom: 8px;"><strong>Reden:</strong> ${reden}</li>
                    </ul>
                </div>
                <p>We nemen zo snel mogelijk contact met je op om een nieuwe datum in te plannen. Onze excuses voor het ongemak.</p>
                <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
            </div>
        `;

        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: reservering.user.email,
            subject,
            html,
        });

        if (response.error) {
            console.error("Resend error cancelNotify:", response.error);
            return res.status(500).json({ message: "Mail kon niet worden verstuurd." });
        }

        return res.status(200).json({ message: `Annuleringsmail (${type}) succesvol verstuurd naar ${reservering.user.email}.` });

    } catch (error) {
        console.error("Fout bij cancelNotify:", error);
        return res.status(500).json({ message: "Server fout bij versturen annuleringsmail." });
    }
};
