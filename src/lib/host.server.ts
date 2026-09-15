import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const HOST_PIN = "Fausto1905";
const COOKIE = "fausto_host";
const TOKEN_PAYLOAD = "fausto-host-v1";

function token() {
  return createHmac("sha256", HOST_PIN).update(TOKEN_PAYLOAD).digest("hex");
}

export function verifyHostPin(pin: string) {
  const given = Buffer.from(pin.normalize("NFC"));
  const expected = Buffer.from(HOST_PIN);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export function isHostUnlocked() {
  try {
    return getCookie(COOKIE) === token();
  } catch {
    return false;
  }
}

export function assertHost() {
  if (!isHostUnlocked()) {
    throw new Error("Necesitás la clave de anfitriones.");
  }
}

export function unlockHostCookie() {
  setCookie(COOKIE, token(), {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });
}
