import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import composeRoutes from './routes/compose.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8091;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8090', 'http://frontend:8090'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/compose', composeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Docker Dashboard Backend running on port ${PORT}`);
  console.log(`📁 Scanning directories: ${process.env.SCAN_DIRECTORIES || 'Not configured'}`);
});
