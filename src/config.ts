import "dotenv/config";
import { randomBytes } from "node:crypto";

export const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString("hex");
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || randomBytes(32).toString("hex");
