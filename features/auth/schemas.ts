import { z } from "zod";

export const emailSchema = z.email().max(254).trim().toLowerCase();

export const passwordSchema = z.string().min(8).max(72);

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  locale: z.enum(["en", "my"]),
  notifyOnOpen: z.boolean(),
  notifyOnResponse: z.boolean(),
});

export type AuthFormState = {
  error?: "invalid" | "credentials" | "exists" | "unknown" | "notConfigured";
  fields?: Partial<Record<"displayName" | "email" | "password", string>>;
};
