import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config.js";

const router = Router();

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function gerarTokens(user: { id: string; role: string }) {
  const accessToken = jwt.sign({ role: user.role }, JWT_SECRET, {
    subject: user.id,
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({}, JWT_REFRESH_SECRET, {
    subject: user.id,
    expiresIn: "7d",
    jwtid: randomUUID(),
  });

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + SETE_DIAS),
    },
  });

  return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    return;
  }

  if (name.trim().length < 2) {
    res.status(400).json({ error: "O nome precisa ter 2 caracteres." });
    return;
  }

  if (!email.includes("@")) {
    res.status(400).json({ error: "E-mail inválido." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "A senha precisa ter pelo menos 8 caracteres." });
    return;
  }

  const emailLower = email.trim().toLowerCase();

  const jaExiste = await prisma.user.findUnique({ where: { email: emailLower } });
  if (jaExiste) {
    res.status(409).json({ error: "E-mail já cadastrado." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const totalUsuarios = await prisma.user.count();

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: emailLower,
      passwordHash,
      role: totalUsuarios === 0 ? "ADMIN" : "USER",
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "E-mail/senha obrigatórios" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.active) {
    res.status(401).json({ error: "E-mail/senha inválidos." });
    return;
  }

  const senhaCorreta = await bcrypt.compare(password, user.passwordHash);

  if (!senhaCorreta) {
    res.status(401).json({ error: "E-mail/senha inválidos." });
    return;
  }

  const { accessToken, refreshToken } = await gerarTokens(user);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};

  if (typeof refreshToken !== "string") {
    res.status(400).json({ error: "O refreshToken é obrigatório." });
    return;
  }

  const registro = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });

  if (!registro || registro.revokedAt) {
    res.status(401).json({ error: "Refresh token inválido." });
    return;
  }

  if (registro.expiresAt < new Date()) {
    res.status(401).json({ error: "Refresh token expirado." });
    return;
  }

  if (!registro.user.active) {
    res.status(401).json({ error: "Usuário inválido." });
    return;
  }

  await prisma.refreshToken.update({
    where: { id: registro.id },
    data: { revokedAt: new Date() },
  });

  res.json(await gerarTokens(registro.user));
});

export default router;
