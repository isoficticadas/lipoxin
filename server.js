require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const { google } = require('googleapis');
const helmet = require('helmet');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit'); // Limitar solicitudes para mayor seguridad
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────────────────────
// 1) Middlewares globales
// ────────────────────────────────────────────────────────────────────────────────

// Seguridad y optimización
app.use(helmet());
app.use(compression()); // Habilita compresión Gzip para las respuestas
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Middleware para CSP con nonce
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex'); // Genera un nonce único para cada solicitud
  next();
});

// Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://connect.facebook.net"],
      imgSrc: ["'self'", "https://www.facebook.com"],
      objectSrc: ["'none'"],
    },
  })
);


// ────────────────────────────────────────────────────────────────────────────────
// 2) Servir archivos estáticos con control de caché
// ────────────────────────────────────────────────────────────────────────────────
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        // Archivos estáticos (CSS, JS, imágenes) con caché prolongada
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    },
  })
);

// ────────────────────────────────────────────────────────────────────────────────
// 3) Rutas estáticas
// ────────────────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/policy.html', (req, res) => res.sendFile(path.join(__dirname, 'policy.html')));

// ────────────────────────────────────────────────────────────────────────────────
// 4) Configurar Rate Limiting para solicitudes /submit
// ────────────────────────────────────────────────────────────────────────────────
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo de 10 solicitudes por IP
  message: {
    error: 'Has enviado demasiadas solicitudes. Por favor, inténtalo de nuevo en 15 minutos.',
  },
});

// ────────────────────────────────────────────────────────────────────────────────
// 5) Lógica para Google Sheets y manejo del formulario
// ────────────────────────────────────────────────────────────────────────────────
const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env;
const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

app.post('/submit', formLimiter, async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Validaciones básicas
    const namePattern = /^[A-Za-z\s]+$/;
    const phonePattern = /^\+593\d{9}$/;

    if (!name || !namePattern.test(name)) {
      return res.status(400).json({ error: 'Nombre inválido. Solo se permiten letras y espacios.' });
    }

    if (!phonePattern.test(phone)) {
      return res.status(400).json({ error: 'Número de teléfono inválido. Ejemplo: +593933543342' });
    }

    const defaultData = 'Lipoxin';
    const timestamp = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });

    // Autenticación con Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cliente!A:D', // Ajustar según tus columnas
      valueInputOption: 'RAW',
      resource: {
        values: [[name, phone, defaultData, timestamp]],
      },
    });

    return res.status(200).json({ message: 'Formulario enviado con éxito' });
  } catch (error) {
    console.error('Error en /submit:', error);
    return res.status(500).json({ error: 'Error al enviar los datos. Intente de nuevo más tarde.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 6) Manejo de errores global
// ────────────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));

// ────────────────────────────────────────────────────────────────────────────────
// 7) Arranque del servidor
// ────────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto localhost${PORT}`));
