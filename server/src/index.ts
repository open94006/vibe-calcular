import express from 'express';
import cors from 'cors';
import productRoute from './routes/product.route';

const app = express();
const PORT = process.env.PORT || 8080;

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

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
