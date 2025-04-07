import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerSchema as userSchema } from './models/user.model.js';
import {PORT} from './config/env.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import diagnosisRouter from './routes/diagnosis.routes.js';
import connectToDatabase from './database/mongodb.js';

const app = express();

//حسبي الله ونعم الوكيل تااااااني
//swagger configuration

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
    info: {
      title: 'Lupira_API',
      version: '0.0.0',
      description: 'API documentation for Lupira',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        schemas: {
          User: userSchema,
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  
  apis: ['./routes/*.js'], //includes all routes
};
  

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    

app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

mongoose.set('strictQuery', true);  // Prevents unexpected document creation
mongoose.set('autoIndex', false);  //Prevents autoIndexing which can cause key duplication

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/diagnosis', diagnosisRouter);

app.get('/', (req, res) => res.send("Insha'allah, the best graduation project"));

app.listen(PORT, async() => {
    console.log(`The server is running on http://localhost:${PORT}`);
    await connectToDatabase();
});
export default app;