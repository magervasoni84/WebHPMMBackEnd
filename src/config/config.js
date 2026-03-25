import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env'); // .env en la raíz del proyecto

dotenv.config({ path: envPath });

export const PORT = process.env.PORT || 5002;