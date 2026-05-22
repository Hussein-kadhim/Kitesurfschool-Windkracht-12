import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
       const token = req.cookies.token;

       if(!token){
        return res.status(401).json({message: "Niet geautoriseerd, geen token"});
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const user = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [decoded.id]);
       if(user.rows.length === 0){
        return res.status(401).json({message: "Gebruiker niet gevonden"});
       }
       req.user = user.rows[0];
       next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({message: "Niet geautoriseerd, token ongeldig of verlopen"});
        }
        return res.status(500).json({message: "Server fout bij verifiëren van gebruiker"});
    }
}