import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000
}

const generateToken = (id) => jwt.sign({id}, process.env.JWT_SECRET || "", {expiresIn: "30d"})

export const register = async (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password) {
        return res.status(400).json({message: "Vul alle velden in"})
    }

    const userExists = await prisma.user.findUnique({
        where: { email }
    });

    if (userExists) {
        return res.status(400).json({message: "Gebruiker bestaat al"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "klant"
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    // Welkomstmail verzenden met Resend
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Welkom bij Kitesurfschool Windkracht-12!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #005B96;">Welkom ${name}!</h2>
                <p>Super leuk dat je een account hebt aangemaakt bij Kitesurfschool Windkracht-12.</p>
                <p>Met dit account kun je eenvoudig je kitesurflessen boeken, je planning inzien en nog veel meer.</p>
                <p>We hopen je snel te zien op het water!</p>
                <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
              </div>
            `
        });
    } catch (emailError) {
        console.error("Fout bij verzenden van welkomstmail via Resend:", emailError);
    }

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({ user })
}


export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) return res.status(400).json({message: "Vul alle velden in"})


    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) return res.status(400).json({message: "Onjuiste combinatie van e-mailadres en wachtwoord"});

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({message: "Onjuiste combinatie van e-mailadres en wachtwoord"});

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role }})
}

export const logout = async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.clearCookie("token", '', {...cookieOptions, maxAge: 1});
        res.json({message: "Uitgelogd"})
    } catch (error) {
        return res.status(500).json({message: "Verbroken verbinding"});
    }
}

export const getMe = async (req, res) => {
    res.json({ user: req.user });
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ message: "Gebruiker met dit e-mailadres niet gevonden" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "", { expiresIn: '15m' });
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: "Wachtwoord Reset",
            html: `<p>Klik op de onderstaande link om je wachtwoord te resetten:</p><a href="${resetLink}">Wachtwoord Resetten</a>`,
        });

        if (error) {
            console.error("Resend API error:", error);
            return res.status(500).json({ message: "Er is iets misgegaan bij het verzenden van de e-mail." });
        }

        res.json({ message: "E-mail verzonden!" });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Er is iets misgegaan bij het verzenden van de e-mail." });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token en nieuw wachtwoord zijn verplicht." });
        }

        const decoded = (jwt.verify(token, process.env.JWT_SECRET || ""));

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        res.json({ message: "Wachtwoord succesvol gewijzigd!" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({ message: "Ongeldige of verlopen link." });
    }
}

export const updateUser = async (req, res) => {
    if(!req.user) return res.status(401).json({message: "Je moet ingelogd zijn om je gegevens te wijzigen"});
    if(req.user?.role !== "eigenaar") return res.status(403).json({message: "Je bent niet gemachtigd om dit te doen"});
    try {
        const { id, role } = req.body;
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role }
        });
        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
}