require('dotenv').config(); // Cargar variables de entorno desde .env

const express = require('express');
const { google } = require('googleapis');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit'); // <--- Importamos express-rate-limit

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────────────────────
// 1) Middlewares globales
// ────────────────────────────────────────────────────────────────────────────────

// === Seguridad y optimización ===
app.use(helmet());
app.use(compression()); // Habilita compresión Gzip para las respuestas
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://code.jquery.com"],
      objectSrc: ["'none'"],
    },
  })
);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ────────────────────────────────────────────────────────────────────────────────
// 2) Servir archivos estáticos con Cache-Control
// ────────────────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Por ejemplo, 1 año para CSS/JS/imágenes con hash de versión
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// ────────────────────────────────────────────────────────────────────────────────
// 3) Rutas estáticas para index.html y policy.html
// ────────────────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy.html'));
});

// ────────────────────────────────────────────────────────────────────────────────
// 4) Configurar Rate Limiting para /submit
// ────────────────────────────────────────────────────────────────────────────────
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // Límite de 10 solicitudes por IP en ese período
  message: {
    error: 'Has enviado demasiadas solicitudes. Por favor, inténtalo de nuevo en 15 minutos.'
  },
  // Puedes ajustar el handler para personalizar la respuesta
  // handler: (req, res, next, options) => { ... }
});

// ────────────────────────────────────────────────────────────────────────────────
// 5) Lógica de Google Sheets y ruta para manejar el envío del formulario
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
      return res.status(400).json({
        error: 'Nombre inválido. Solo se permiten letras y espacios.'
      });
    }

    if (!phonePattern.test(phone)) {
      return res.status(400).json({
        error: 'Número de teléfono inválido. Ejemplo: +593933543342'
      });
    }

    // Datos extra
    const defaultData = 'Lipoxin';
    const timestamp = new Date().toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil'
    });

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
      range: 'Cliente!A:D', // Ajusta tu rango si cambias columnas
      valueInputOption: 'RAW',
      resource: {
        values: [[name, phone, defaultData, timestamp]],
      },
    });

    // Respuesta de éxito
    return res.status(200).json({
      message: 'Formulario enviado con éxito'
    });

  } catch (error) {
    console.error('Error en /submit:', error);
    return res.status(500).json({
      error: 'Error al enviar los datos. Intente de nuevo más tarde.'
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 6) Manejo de errores global (Opcional)
// ────────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

// ────────────────────────────────────────────────────────────────────────────────
// 7) Arranque del servidor
// ────────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}...`);
});
