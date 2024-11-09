export const config = {
    HOST: process.env.SIGNER_HOST as string || "localhost",
    PORT: Number(process.env.SIGNER_PORT as string) || 7000,
  };