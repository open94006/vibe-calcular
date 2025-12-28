import express from 'express';
import cors from 'cors';
import productRoute from './routes/product.route';

const app = express();
const PORT = 5100;

const corsOptions = {
    origin: 'http://localhost:5173',
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

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});