import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cartRouter from "./routes/cart.js";
dotenv.config();

const backendPort = process.env.BACKEND_PORT as string;
const envPort = process.env.PORT as string;
const PORT = parseInt(backendPort || envPort, 10);

const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use(cors());

app.use(express.json());
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
});

app.use('/api/app_proxy',cartRouter)


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});