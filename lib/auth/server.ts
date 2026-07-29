import { betterAuth } from "better-auth"
import { emailOTP, organization } from "better-auth/plugins"
import { pool } from "@/lib/db"

const productionURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined
const deploymentURL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined
const runtimeURL = process.env.V0_RUNTIME_URL ?? undefined

const baseURL =
  process.env.BETTER_AUTH_URL ??
  productionURL ??
  deploymentURL ??
  runtimeURL ??
  "http://localhost:3000"

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  productionURL,
  deploymentURL,
  runtimeURL,
  "http://localhost:3000",
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      // Email OTP-verificatie via Neon Auth's managed service.
      // De emails worden automatisch verstuurd door Neon via hun shared provider (auth@mail.myneon.app).
      // In development, we loggen de OTP in de console voor testing.
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[billenboek OTP] Code voor ${email}: ${otp}`)
        }
      },
    }),
    organization({
      // Elke gebruiker mag een gezin aanmaken en leden uitnodigen.
      allowUserToCreateOrganization: true,
    }),
  ],
  ...(process.env.NODE_ENV === "development" && {
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  }),
})

export type Session = typeof auth.$Infer.Session
