import express from 'express';
import cors from 'cors';
import productRoute from './routes/product.route';

const app = express();
const PORT = process.env.PORT || 8080;

// 新增簡單的健康檢查路徑與靜態檔案服務（選配，但建議檢查）
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = new Set(['http://localhost:5173', 'http://z-running.com', 'https://z-running.com', process.env.CORS_ORIGIN].filter(Boolean));

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

app.use('/api/product', productRoute);

// 服務前端靜態檔案 (選配，確保 Cloud Run 能正確服務前端)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
