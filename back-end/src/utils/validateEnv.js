export const validateEnv = () => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file exists and contains all required variables');
    process.exit(1);
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  // Validate Supabase URL format
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    console.error('❌ SUPABASE_URL must be a valid HTTPS URL');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
  console.log(`🌍 Running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
};
