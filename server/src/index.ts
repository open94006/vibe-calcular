import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productRoute from './routes/product.route.js';
import weatherRoute from './routes/weather.route.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderHTMLWithSEO, defaultSEO } from './services/seo.service.js';

const app = express();
const PORT = process.env.PORT || 5100;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = new Set(
    ['https://vibe-calculator-810458374554.asia-east1.run.app', 'http://localhost:5173', 'http://z-running.com', 'https://z-running.com', process.env.CORS_ORIGIN].filter(Boolean),
);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header) like health checks / server-to-server.
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express + TS backend!' });
});

app.get('/api/seo', (req, res) => {
    res.json(defaultSEO);
});

app.use('/api/product', productRoute);
app.use('/api/weather', weatherRoute);

// 服務前端靜態檔案 (選配，確保 Cloud Run 能正確服務前端)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get(/.*/, (req, res, next) => {
    console.log('request received');
    if (req.path.startsWith('/api')) return next();

    // 透過 SEO service 動態渲染 index.html
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    const renderedHtml = renderHTMLWithSEO(htmlPath);
    console.log('renderedHtml');
    res.send(renderedHtml);
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
