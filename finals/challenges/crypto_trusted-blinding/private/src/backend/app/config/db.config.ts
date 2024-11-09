export const config = {
  HOST: process.env.DB_HOST as string || "localhost",
  PORT: Number(process.env.DB_PORT as string) || 6000,
  USER: process.env.DB_USER as string || "postgres",
  PASSWORD: process.env.DB_PASSWORD as string || "debugpsqlpass",
  DB: process.env.DB_NAME as string || "trusted_blinding",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};