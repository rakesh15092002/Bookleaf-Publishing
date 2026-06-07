import dotenv from 'dotenv';
dotenv.config();

import validateEnv from './src/config/env.js';
import app from './src/app.js';

validateEnv();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BookLeaf Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});