import jwt from "jsonwebtoken";
import {prisma} from "../lib/prisma.js";

export const protect = async (req, res, next) => {
    try {
       const token = req.cookies.token;

       if(!token){
        return res.status(401).json({message: "Niet geautoriseerd, geen token"});
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
       const user = await prisma.user.findUnique({
         where: { id: decoded.id },
         select: {
           id: true,
           name: true,
           email: true,
           role: true,
         }
       });

       if(!user){
        return res.status(401).json({message: "Gebruiker niet gevonden"});
       }

       req.user = user;
       next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({message: "Niet geautoriseerd, token ongeldig of verlopen"});
        }
        return res.status(500).json({message: "Server fout bij verifiëren van gebruiker"});
    }
}