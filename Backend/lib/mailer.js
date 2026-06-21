import "dotenv/config";
import nodemailer from "nodemailer";

// Configureer de Nodemailer transporter met Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Kitesurfschool Windkracht-12" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        
        console.log("Email verzonden via Nodemailer. MessageId:", info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error("Fout bij verzenden email via Nodemailer:", error);
        return { success: false, error };
    }
};
