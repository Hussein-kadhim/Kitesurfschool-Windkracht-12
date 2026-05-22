
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import nodemailer from "nodemailer";

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
   secure: process.env.NODE_ENV === 'production',
   sameSite: "strict",
   maxAge: 30 * 24 * 60 * 60 * 1000  //Cookies is 30 dagen geldig
}

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "30d"})
}

//Registeren 
router.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password) {
        return res.status(400).json({message: "Vul alle velden in"})
    }
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
        return res.status(400).json({message: "Gebruiker bestaat al"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'klant') RETURNING id, name, email, role",
    [name, email, hashedPassword]);

    const token = generateToken(user.rows[0].id);

    res.cookie("token", token, cookieOptions)
    
    return res.status(201).json({
        user: user.rows[0]
    })
})

// Login
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json({message: "Vul alle velden in"})
    }
  
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (user.rows.length === 0) {
        return res.status(400).json({message: "Gebruiker bestaat niet"});
    }

    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
        return res.status(400).json({message: "Verkeerd wachtwoord"});
    }
    const token = generateToken(userData.id);
    res.cookie("token",token, cookieOptions);
    
   res.json({user: {id: userData.id, name: userData.name, email: userData.email, role: userData.role}})
    }) 

    // Me

router.get("/me", protect, async (req, res) => {
    res.json({ user: req.user });
    //Retourneer informatie van de ingelogde gebruiker vanuit de protect middleware
})

// Logout
router.post("/logout", async (req, res) => {
    try {
        // Check of de database aan staat (speciaal voor jouw unhappy scenario test!)
        await pool.query("SELECT 1"); 
        
        res.clearCookie("token", '', {...cookieOptions, maxAge: 1});
        res.json({message: "Uitgelogd"})
    } catch (error) {
        return res.status(500).json({message: "Verbroken verbinding"});
    }
})

// Wachtwoord Vergeten (E-mail sturen)
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "Gebruiker met dit e-mailadres niet gevonden" });
        }
        const user = userQuery.rows[0];

        // Genereer een reset token geldig voor 15 minuten
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Maak Ethereal test account
        const testAccount = await nodemailer.createTestAccount();

        // Maak een transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        // Verander port naar Vite port 
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;

        // Stuur e-mail
        const info = await transporter.sendMail({
            from: '"Kitesurfschool Windkracht-12" <noreply@windkracht12.nl>',
            to: email,
            subject: "Wachtwoord Reset",
            text: `Klik op deze link om je wachtwoord te resetten: ${resetLink}`,
            html: `<p>Klik op de onderstaande link om je wachtwoord te resetten:</p><a href="${resetLink}">Wachtwoord Resetten</a>`,
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        // We sturen de preview URL terug zodat de frontend hem kan laten zien (alleen voor testdoeleinden!)
        res.json({ message: "E-mail verzonden!", url: nodemailer.getTestMessageUrl(info) });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Er is iets misgegaan bij het verzenden van de e-mail." });
    }
});

// Wachtwoord Resetten 
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token en nieuw wachtwoord zijn verplicht." });
        }

        // Verifieer het token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Hash het nieuwe wachtwoord
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update het wachtwoord in de database
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);

        res.json({ message: "Wachtwoord succesvol gewijzigd!" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({ message: "Ongeldige of verlopen link." });
    }
});

export default router