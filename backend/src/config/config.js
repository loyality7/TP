const config = {
  // ... your existing config
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'your-email@example.com'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

export default config; 