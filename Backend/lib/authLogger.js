import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../logs/auth.log');

// Zorg dat de logs map bestaat bij het opstarten van de server
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

export const logAuthEvent = (email, eventType) => {
  try {
    // process.hrtime.bigint() geeft de tijd in nanoseconden
    // Wij delen door 1000n om microsecondes te krijgen
    const microseconds = String(process.hrtime.bigint() / 1000n % 1000000n).padStart(6, '0');
    const timestamp = `${new Date().toISOString().slice(0, 19)}.${microseconds}Z`;

    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${eventType.toUpperCase()} - ${email}\n`, 'utf8');
  } catch (err) {
    console.error('Fout bij loggen:', err);
  }
};
