import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

export const createUser = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        let { name, email, password, role, address, city, dateOfBirth, phone, bsn } = req.body;

        if (req.user.role === 'instructeur') {
            role = 'klant'; // Instructors can only create klanten
        }

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Naam, e-mailadres, wachtwoord en rol zijn verplicht" });
        }

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "Er bestaat al een account met dit e-mailadres" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                address:     address     || null,
                city:        city        || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone:       phone       || null,
                bsn:         role === 'klant' ? null : (bsn || null),
                isVerified:  true, // Admin-created accounts are pre-verified
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                address: true,
                city: true,
                dateOfBirth: true,
                phone: true,
                bsn: true,
                isVerified: true,
            }
        });

        // Stuur welkomstmail
        try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const loginLink = `http://localhost:5173/login`;
            
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: email,
                subject: 'Welkom bij Windkracht-12!',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #005B96;">Welkom!</h2>
                    <p>Beste ${name || 'kitesurfer'},</p>
                    <p>Er is succesvol een account voor je aangemaakt bij Kitesurfschool Windkracht-12.</p>
                    <p>Je kunt vanaf nu inloggen met je e-mailadres en het wachtwoord dat je van ons hebt ontvangen.</p>
                    <a href="${loginLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #005B96; text-decoration: none; border-radius: 5px;">Direct Inloggen</a>
                    <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
                  </div>
                `
            });
        } catch (emailError) {
            console.error("Fout bij verzenden van welkomstmail:", emailError);
        }

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Fout bij aanmaken gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet aanmaken" });
    }
};
