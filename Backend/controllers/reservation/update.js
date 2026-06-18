import "dotenv/config";
import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const LESSON_LABELS = {
  PRIVE_LES:      'Privéles',
  LOSSE_DUO_LES:  'Losse Duo Kiteles',
  DUO_PAKKET_3:   'Duo Lespakket 3 Lessen',
  DUO_PAKKET_5:   'Duo Lespakket 5 Lessen',
};

export const updateReservation = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Je moet ingelogd zijn om je reservering te wijzigen" });

    try {
        const { id } = req.params;
        const { bookingDate, status, hasPaid, cancelReason } = req.body;

        // Haal de reservering + gebruiker + instructeur op
        const bestaand = await prisma.reservation.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true } },
                instructor: { select: { name: true, email: true } },
            },
        });

        if (!bestaand)
            return res.status(404).json({ message: "Reservering niet gevonden" });

        // Klant mag alleen eigen reservering wijzigen; eigenaar/instructeur mag alles
        if (req.user.role === 'klant' && bestaand.userId !== req.user.id)
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

        if (typeof hasPaid === 'boolean') {
            updateData.hasPaid = hasPaid;
            if (hasPaid === true && (!status || status !== "GEANNULEERD")) {
                updateData.status = "DEFINITIEF";
            }
        }

        // Sla de annuleringsreden op als meegegeven
        if (cancelReason !== undefined) {
            updateData.cancelReason = cancelReason;
        }

        const reservation = await prisma.reservation.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        const lesNaam = LESSON_LABELS[bestaand.lesson] || bestaand.lesson;
        const lesDatum = new Date(bestaand.bookingDate).toLocaleDateString('nl-NL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });

        // --- Stuur e-mails bij annulering door klant ---
        if (updateData.status === 'GEANNULEERD') {
            const reden = updateData.cancelReason || cancelReason || 'Geen reden opgegeven';

            // Mail 1: bevestiging aan de klant
            try {
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: bestaand.user.email,
                    subject: 'Annulering ontvangen - Kitesurfschool Windkracht-12',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #c0392b;">Annulering ontvangen</h2>
                            <p>Beste ${bestaand.user.name},</p>
                            <p>We hebben je annulering ontvangen en verwerkt.</p>
                            <div style="background-color: #fff5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #c0392b;">
                                <ul style="list-style: none; padding-left: 0; margin: 0;">
                                    <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                                    <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${lesDatum}</li>
                                    <li style="margin-bottom: 8px;"><strong>Jouw reden:</strong> ${reden}</li>
                                </ul>
                            </div>
                            <p>Heb je vragen? Neem dan contact op met ons via de website.</p>
                            <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
                        </div>
                    `,
                });
            } catch (e) { console.error("Fout annuleringsmail klant:", e); }

            // Mail 2: melding aan de eigenaar
            const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';
            try {
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: ownerEmail,
                    subject: `Klant heeft les geannuleerd - ${bestaand.user.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #c0392b;">Les geannuleerd door klant</h2>
                            <p>Een klant heeft een les geannuleerd. Hieronder de details:</p>
                            <div style="background-color: #fff5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #c0392b;">
                                <ul style="list-style: none; padding-left: 0; margin: 0;">
                                    <li style="margin-bottom: 8px;"><strong>Klant:</strong> ${bestaand.user.name} (${bestaand.user.email})</li>
                                    <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                                    <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${lesDatum}</li>
                                    <li style="margin-bottom: 8px;"><strong>Reden:</strong> ${reden}</li>
                                </ul>
                            </div>
                            <p>Log in op het dashboard om de reservering te beheren.</p>
                            <p>Met vriendelijke groet,<br><br><strong>Systeem Windkracht-12</strong></p>
                        </div>
                    `,
                });
            } catch (e) { console.error("Fout annuleringsmail eigenaar:", e); }
        }


        if (bookingDate) {
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
                            <p>De datum van je reservering is succesvol gewijzigd.</p>
                            <div style="background-color: #f5f5f0; padding: 15px; margin: 20px 0; border-left: 4px solid #111;">
                                <ul style="list-style: none; padding-left: 0; margin: 0;">
                                    <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                                    <li style="margin-bottom: 8px;"><strong>Oude datum:</strong> <span style="text-decoration: line-through; color: #999;">${oudeDatum}</span></li>
                                    <li style="margin-bottom: 8px;"><strong>Nieuwe datum:</strong> ${nieuweDatum}</li>
                                    <li style="margin-bottom: 8px;"><strong>Bedrag:</strong> €${bestaand.price.toFixed(2)}</li>
                                </ul>
                            </div>
                            <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Fout bij verzenden wijzigingsmail:", emailError);
            }
        }

        // --- Stuur bevestigingsmail naar klant ÉN instructeur als status DEFINITIEF wordt ---
        if (updateData.status === "DEFINITIEF") {
            const bevestigingsDatum = new Date(bestaand.bookingDate).toLocaleDateString('nl-NL', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            });

            const clientHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #005B96;">Reservering Bevestigd</h2>
                  <p>Beste ${bestaand.user.name},</p>
                  <p>Geweldig nieuws! Je betaling is ontvangen en je reservering is definitief bevestigd. We kijken ernaar uit om samen met jou het water op te gaan.</p>
                  <div style="background-color: #f5f5f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111;">Jouw reserveringsgegevens:</h3>
                    <ul style="list-style: none; padding-left: 0;">
                       <li style="margin-bottom: 10px;"><strong>Les:</strong> ${lesNaam}</li>
                       <li style="margin-bottom: 10px;"><strong>Datum:</strong> ${bevestigingsDatum}</li>
                       <li style="margin-bottom: 10px;"><strong>Totaalbedrag:</strong> €${bestaand.price.toFixed(2)}</li>
                       ${bestaand.instructor ? `<li style="margin-bottom: 10px;"><strong>Instructeur:</strong> ${bestaand.instructor.name}</li>` : ''}
                    </ul>
                  </div>
                  <p>We nemen binnenkort contact met je op als er bijzonderheden zijn met betrekking tot de wind- en weersomstandigheden.</p>
                  <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
                </div>
            `;

            try {
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: bestaand.user.email,
                    subject: 'Bevestiging: Je kitesurflessen gaan door! - Windkracht-12',
                    html: clientHtml,
                });
            } catch (e) { console.error("Fout klantmail DEFINITIEF:", e); }

            // Mail ook naar instructeur als er een is
            if (bestaand.instructor?.email) {
                const instructeurHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #005B96;">Nieuwe bevestigde les</h2>
                        <p>Beste ${bestaand.instructor.name},</p>
                        <p>De betaling van je klant is ontvangen. De volgende les is definitief bevestigd:</p>
                        <div style="background-color: #f0f7ff; padding: 15px; margin: 20px 0; border-left: 4px solid #005B96;">
                            <ul style="list-style: none; padding-left: 0; margin: 0;">
                                <li style="margin-bottom: 8px;"><strong>Klant:</strong> ${bestaand.user.name}</li>
                                <li style="margin-bottom: 8px;"><strong>Les:</strong> ${lesNaam}</li>
                                <li style="margin-bottom: 8px;"><strong>Datum:</strong> ${bevestigingsDatum}</li>
                            </ul>
                        </div>
                        <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
                    </div>
                `;
                try {
                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                        to: bestaand.instructor.email,
                        subject: 'Bevestigde les - Kitesurfschool Windkracht-12',
                        html: instructeurHtml,
                    });
                } catch (e) { console.error("Fout instructeurmail DEFINITIEF:", e); }
            }
        }

        res.json(reservation);
    } catch (error) {
        console.error("Fout bij bijwerken reservering:", error);
        res.status(500).json({ message: "Server fout bij bijwerken van reservering" });
    }
}