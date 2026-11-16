import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE = "copyvault_admin";
const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(value);
};

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("copyvault")
    .setAudience("copyvault-admin")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

export async function isAdmin(request?: NextRequest) {
  try {
    const token = request ? request.cookies.get(COOKIE)?.value : (await cookies()).get(COOKIE)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "copyvault",
      audience: "copyvault-admin",
      algorithms: ["HS256"]
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(request: NextRequest) {
  return isAdmin(request);
}