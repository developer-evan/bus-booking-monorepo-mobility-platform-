export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  database: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  seed: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPhone: process.env.SUPER_ADMIN_PHONE,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
    superAdminFullName: process.env.SUPER_ADMIN_FULL_NAME,
  },
});
