import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export const createReservation = async (req, res) => {

    if(!req.user) return res.status(401).json({message: "Je moet ingelogd zijn om te reserveren"});
   
    try{

        const {lesson, bookingDate, price} = req.body;

        if(!lesson || !bookingDate || price === undefined || price === null) {
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

        const reservation = await prisma.reservation.create({
            data: {
                userId: req.user.id,
                lesson,
                bookingDate: parsedDate,
                price: parsedPrice
            }
        });

        try {
            await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: req.user.email,
              subject: 'Bevestiging: Je Kitesurfles bij Windkracht-12 is gereserveerd',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #005B96;">Reservering Bevestigd</h2>
                  <p>Beste ${req.user.name},</p>
                  <p>Bedankt voor je reservering bij Kitesurfschool Windkracht-12! We kijken ernaar uit om samen met jou het water op te gaan.</p>
                  <div style="background-color: #f5f5f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111;">Jouw reserveringsgegevens:</h3>
                    <ul style="list-style: none; padding-left: 0;">
                       <li style="margin-bottom: 10px;"><strong>Les:</strong> ${lesson}</li>
                       <li style="margin-bottom: 10px;"><strong>Datum:</strong> ${parsedDate.toLocaleDateString('nl-NL')}</li>
                       <li><strong>Totaalbedrag:</strong> €${parsedPrice.toFixed(2)}</li>
                    </ul>
                  </div>
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
        return res.status(500).json({message: "Er is iets misgegaan bij het reserveren."});
    }
}