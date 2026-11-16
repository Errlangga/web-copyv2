import { z } from "zod";

export const catalogSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(""),
  content: z.string().min(1).max(50000),
  documentUrl: z.string().url().max(2048).nullable().optional(),
  documentName: z.string().max(180).nullable().optional()
});

export const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256)
});