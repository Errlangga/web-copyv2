import { z } from "zod";

export const catalogSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(""),
  content: z.string().min(1).max(50000),
  documentUrl: z.string().url().max(2048).nullable().optional(),
  documentName: z.string().max(180).nullable().optional(),
  accessType: z.enum(["free","paid"]).default("free"),
  price: z.number().min(0).max(999999999).nullable().optional()
}).superRefine((data,ctx)=>{
  if(data.accessType==="paid" && (!data.price || data.price<=0))
    ctx.addIssue({code:"custom",path:["price"],message:"Harga prompt berbayar wajib lebih dari 0"});
  if(data.accessType==="free" && data.price && data.price>0)
    ctx.addIssue({code:"custom",path:["price"],message:"Katalog gratis tidak menggunakan harga"});
});

export const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256)
});
