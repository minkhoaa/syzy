import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(7788),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  WAITLIST_APP_ORIGIN: z.string().url(),
  WAITLIST_APP_DOMAIN: z.string().default(''),
  WAITLIST_MEMBER_JWT_SECRET: z.string().min(32),
  WAITLIST_ADMIN_JWT_SECRET: z.string().min(32),
  WAITLIST_MEMBER_REFRESH_SECRET: z.string().min(32),
  WAITLIST_ADMIN_REFRESH_SECRET: z.string().min(32),
  WAITLIST_INITIAL_ADMIN_WALLETS: z.string().default(''),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  EMAIL_FROM: z.string().default('waitlist@syzy.fun'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }
  return result.data;
}
