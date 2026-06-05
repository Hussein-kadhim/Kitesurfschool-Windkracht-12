import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'auth.log');

export const logAuthEvent = (email, eventType) => {
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const date = new Date();
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    const hrTime = process.hrtime();
    // Get last 3 digits of the microsecond offset from the high-res timer
    const microPart = Math.floor(hrTime[1] / 1000).toString().padStart(6, '0').slice(-3);
    const timestamp = `${date.toISOString().slice(0, 19)}.${ms}${microPart}Z`;

    const logLine = `[${timestamp}] ${eventType.toUpperCase()} - ${email}\n`;
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (error) {
    console.error("Fout bij schrijven naar auth log:", error);
  }
};
