import { authenticateToken } from './middleware/auth.middleware.js';
import cors from 'cors';
import express from 'express';

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

app.use('/api', authenticateToken); 