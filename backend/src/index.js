import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import User from "./models/user.model.js";
import adminRoutes from "./routes/admin.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import { authenticateToken } from './middleware/auth.middleware.js';
import userRoutes from "./routes/user.routes.js";
import codeRoutes from "./routes/code.routes.js";
import analyticsRoutes from './routes/analytics.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Add Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CodeQuest API Documentation",
      version: "1.0.0",
      description: "API documentation for CodeQuest application",
    },
    servers: [
      {
        url: process.env.SERVER_URL || "http://localhost:5000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ["./src/routes/*.js"],
  swaggerOptions: {
    docExpansion: 'none',
    deepLinking: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();

// Configure CORS before other middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Update JSON and URL-encoded payload limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// First apply the authentication middleware
app.use('/api', authenticateToken); // Move this BEFORE the routes

// Add this before your routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Then apply the routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/user", userRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/analytics", analyticsRoutes);

// Swagger UI route last
app.use("/api-docs", 
  swaggerUI.serve, 
  swaggerUI.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "CodeQuest API Documentation"
  })
);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      console.log('Attempting to create default admin...');
      await User.createDefaultAdmin();
      console.log('Admin creation process completed');
    } catch (err) {
      console.error('Error during admin creation:', err);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
