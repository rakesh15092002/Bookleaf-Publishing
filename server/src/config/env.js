import dotenv from 'dotenv';
dotenv.config();

const validateEnv = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'GROQ_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (process.env.USE_PINECONE === 'true') {
    const pineconeRequired = [
      'PINECONE_API_KEY',
      'PINECONE_ENVIRONMENT',
      'PINECONE_INDEX_NAME'
    ];
    missing.push(...pineconeRequired.filter(key => !process.env[key]));
  }

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};

export default validateEnv;