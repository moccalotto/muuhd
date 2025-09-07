export const ENV = process.env.NODE_ENV || "prod";
export const DEV = ENV === "dev";
export const PROD =!DEV;
export const PORT = process.env.PORT || 3000;
