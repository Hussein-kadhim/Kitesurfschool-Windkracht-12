import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import crypto from 'crypto';
import { logAuthEvent } from "../lib/authLogger.js";
import { sendEmail } from "../lib/mailer.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000
}

const generateToken = (id) => jwt.sign({id}, process.env.JWT_SECRET || "", {expiresIn: "30d"})

export const register = async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.status(400).json({message: "Vul een e-mailadres in"})
    }

    const userExists = await prisma.user.findUnique({
        where: { email }
    });

    if (userExists) {
        // Om herhaaldelijk testen met je eigen Resend e-mailadres mogelijk te maken,
        // verwijderen we de bestaande gebruiker en zijn reserveringen eerst.
        await prisma.reservation.deleteMany({ where: { userId: userExists.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: userExists.id } }).catch(() => {});
    }

    // Generate a secure, random temporary password because Prisma password field is non-nullable.
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');


    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            verificationToken,
            role: "klant"
        },
        select: {
            id: true,
            email: true,
            role: true
        }
    });

    const activationLink = `http://localhost:5173/verify?token=${verificationToken}`;


    // Welkomstmail verzenden met Resend
    const response = await sendEmail({
        to: email,
        subject: 'Activeer je Windkracht-12 account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #005B96;">Welkom!</h2>
            <p>Super leuk dat je een account hebt aangemaakt bij Kitesurfschool Windkracht-12.</p>
            <p>Klik op de onderstaande link om je account te activeren en je wachtwoord in te stellen:</p>
            <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #005B96; text-decoration: none; border-radius: 5px;">Account Activeren</a>
            <p>Met sportieve groet,<br><br><strong>Team Windkracht-12</strong></p>
          </div>
        `
    });
    
    if (!response.success) {
        console.error("Fout bij het versturen van de activatiemail:", response.error);
    }
    // Error handling removed because sendEmail handles try-catch

    return res.status(201).json({ 
        message: "Registratie gestart! Controleer je e-mail om je account te activeren en je wachtwoord in te stellen.",
        user: user
     })
}


export const verifyEmail = async (req, res) => {
    const { token, name, password } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Geen token opgegeven." });
    }

    if (!name) {
        return res.status(400).json({ message: "Volledige naam is verplicht." });
    }

    if (!password) {
        return res.status(400).json({ message: "Wachtwoord is verplicht." });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={\[\]|\\:;"'<>,.?/-]).{12,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Wachtwoord moet minstens 12 tekens lang zijn en een hoofdletter, cijfer en leesteken bevatten." });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ message: "Ongeldige of verlopen activatiecode." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                isVerified: true,
                password: hashedPassword,
                verificationToken: null // Verwijder de token na succesvolle verificatie
            }
        });

        const jwtToken = generateToken(updatedUser.id);
        res.cookie("token", jwtToken, cookieOptions);

        logAuthEvent(updatedUser.email, "login");

        return res.status(200).json({ 
            message: "Je account is succesvol geactiveerd!",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                address: updatedUser.address,
                city: updatedUser.city,
                dateOfBirth: updatedUser.dateOfBirth,
                phone: updatedUser.phone,
                bsn: updatedUser.bsn
            }
        });
    } catch (error) {
        console.error("Fout bij verificatie:", error);
        return res.status(500).json({ message: "Er is een fout opgetreden bij het verifiëren van je account." });
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) return res.status(400).json({message: "Vul alle velden in"})

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) return res.status(400).json({message: "Onjuiste combinatie van e-mailadres en wachtwoord"});

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({message: "Onjuiste combinatie van e-mailadres en wachtwoord"});

    if (user.isVerified === false) {
        return res.status(403).json({message: "Je account is nog niet geactiveerd. Controleer je e-mail voor de activatielink."});
    }

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    // Log login event
    logAuthEvent(user.email, "login");

    res.json({ 
        user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            address: user.address,
            city: user.city,
            dateOfBirth: user.dateOfBirth,
            phone: user.phone,
            bsn: user.bsn
        }
    });
}

export const logout = async (req, res) => {
    try {
        if (req.user) {
            logAuthEvent(req.user.email, "logout");
        }
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

        const response = await sendEmail({
            to: email,
            subject: "Wachtwoord Reset",
            html: `<p>Klik op de onderstaande link om je wachtwoord te resetten:</p><a href="${resetLink}">Wachtwoord Resetten</a>`,
        });

        if (!response.success) {
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

export const updateProfile = async (req, res) => {
    try {
        const { name, address, city, dateOfBirth, phone, bsn } = req.body;
        const userId = req.user.id;

        // BSN only allowed for owner and instructor
        const finalBsn = req.user.role === 'klant' ? null : bsn;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                address,
                city,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone,
                bsn: finalBsn
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
                bsn: true
            }
        });
        res.json({ user: updatedUser });
    } catch (error) {
        console.error("Fout bij bijwerken profiel:", error);
        res.status(500).json({ message: "Kon profiel niet bijwerken" });
    }
}

export const getAllUsers = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                address: true,
                city: true,
                dateOfBirth: true,
                phone: true,
                bsn: true
            },
            orderBy: { id: 'asc' }
        });
        res.json(users);
    } catch (error) {
        console.error("Fout bij ophalen gebruikers:", error);
        res.status(500).json({ message: "Kon gebruikers niet ophalen" });
    }
}

export const createUser = async (req, res) => {
    if (req.user.role !== 'eigenaar') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const { name, email, password, role, address, city, dateOfBirth, phone, bsn } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Vul e-mailadres, wachtwoord en rol in" });
        }
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "Gebruiker bestaat al" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                address,
                city,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone,
                bsn: role === 'klant' ? null : bsn
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Fout bij aanmaken gebruiker:", error);
        res.status(500).json({ message: "Kon gebruiker niet aanmaken" });
    }
}

export const updateUser = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const { id } = req.params;
        const { name, email, role, address, city, dateOfBirth, phone, bsn } = req.body;

        // Instructors can't change roles, only Eigenaar can
        const finalRole = req.user.role === 'instructeur' ? undefined : role;

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                role: finalRole,
                address,
                city,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone,
                bsn: role === 'klant' ? null : bsn
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
                bsn: true
            }
        });
        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
}

export const deleteUser = async (req, res) => {
    if (req.user.role !== 'eigenaar' && req.user.role !== 'instructeur') {
        return res.status(403).json({ message: "Toegang geweigerd" });
    }
    try {
        const { id } = req.params;
        const targetUserId = parseInt(id);

        // Delete reservations of target user first to prevent foreign key errors
        await prisma.reservation.deleteMany({
            where: { userId: targetUserId }
        });

        // Set instructor ID to null on reservations they were teaching
        await prisma.reservation.updateMany({
            where: { instructorId: targetUserId },
            data: { instructorId: null }
        });

        await prisma.user.delete({
            where: { id: targetUserId }
        });

        res.json({ message: "Gebruiker succesvol verwijderd" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
}