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

export const createReservation = async (req, res) => {

    if(!req.user) return res.status(401).json({message: "Je moet ingelogd zijn om te reserveren"});
   
    try{

        const {lesson, bookingDate, price, location, duoName, duoAddress, duoCity, duoPhone} = req.body;

        if(!lesson || !bookingDate || price === undefined || price === null || !location) {
            return res.status(400).json({message: "Vul alle velden in"});
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            return res.status(400).json({message: "Prijs moet een geldig getal zijn"});
        }

        const parsedDate = new Date(bookingDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({message: "Ongeldige datum"});
        }

        if(req.user.role !== "klant") {
            return res.status(403).json({message: "Geen toestemming om te reserveren"});
        }

        const isDuo = lesson !== 'PRIVE_LES';
        if (isDuo) {
            if (!duoName || !duoAddress || !duoCity || !duoPhone) {
                return res.status(400).json({message: "Vul alle gegevens van je duo-partner in."});
            }
        }

        const reservation = await prisma.reservation.create({
            data: {
                userId: req.user.id,
                lesson,
                bookingDate: parsedDate,
                price: parsedPrice,
                location,
                duoName: isDuo ? duoName : null,
                duoAddress: isDuo ? duoAddress : null,
                duoCity: isDuo ? duoCity : null,
                duoPhone: isDuo ? duoPhone : null,
            }
        });

        const bookingConfirmation = `http://localhost:5173/bevestiging/${reservation.id}`;
        const lesNaam = LESSON_LABELS[lesson] || lesson;
        const lesDatum = parsedDate.toLocaleDateString('nl-NL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        let duoGegevensHtml = '';
        if (isDuo) {
            duoGegevensHtml = `
                <div style="background-color: #f5f5f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111;">Gegevens Duo-partner:</h3>
                    <ul style="list-style: none; padding-left: 0; margin: 0;">
                        <li style="margin-bottom: 8px;"><strong>Naam:</strong> ${duoName}</li>
                        <li style="margin-bottom: 8px;"><strong>Telefoon:</strong> ${duoPhone}</li>
                        <li style="margin-bottom: 8px;"><strong>Adres:</strong> ${duoAddress}, ${duoCity}</li>
                    </ul>
                </div>
            `;
        }

        try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
              to: req.user.email,
              subject: 'Bevestiging: Je Kitesurfles bij Windkracht-12 is gereserveerd',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #005B96;">Reservering Bevestigd</h2>
                  <p>Beste ${req.user.name},</p>
                  <p>Bedankt voor je reservering bij Kitesurfschool Windkracht-12! We kijken ernaar uit om samen met jou het water op te gaan.</p>
                  <div style="background-color: #f5f5f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111;">Jouw reserveringsgegevens:</h3>
                    <ul style="list-style: none; padding-left: 0; margin: 0;">
                       <li style="margin-bottom: 10px;"><strong>Les:</strong> ${lesNaam}</li>
                       <li style="margin-bottom: 10px;"><strong>Datum:</strong> ${lesDatum}</li>
                       <li style="margin-bottom: 10px;"><strong>Locatie:</strong> ${location}</li>
                       <li style="margin-bottom: 10px;"><strong>Totaalbedrag:</strong> €${parsedPrice.toFixed(2)}</li>
                    </ul>
                  </div>
                  ${duoGegevensHtml}
                  <a href="${bookingConfirmation}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #005B96; text-decoration: none; border-radius: 5px; margin-top: 10px; margin-bottom: 10px;">Bevestig je reservering (betalen)</a>
                  <p>We nemen binnenkort contact met je op als er bijzonderheden zijn met betrekking tot de wind- en weersomstandigheden.</p>
                  <p>Met vriendelijke groet,<br><br><strong>Team Windkracht-12</strong></p>
                </div>
              `
            });
        } catch (emailError) {
            console.error("Fout bij verzenden van e-mail via Resend:", emailError);
        }

        res.json(reservation);
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Er is iets misgegaan bij het reserveren: " + error.message});
    }
}