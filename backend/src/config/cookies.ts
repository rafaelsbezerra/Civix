import { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = "sessao";

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax", // use "lax" fixo se front e API estiverem no mesmo site
  maxAge: 60 * 60 * 1000, // 1h, igual ao expiresIn do JWT
  path: "/",
};