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
      // Stuur een 6-cijferige code per e-mail voor verificatie en
      // wachtwoordherstel. De daadwerkelijke verzending gaat via de
      // sendVerificationOTP-hook hieronder.
      async sendVerificationOTP({ email, otp, type }) {
        // In development: log de OTP zodat hij zichtbaar is in de console.
        // In production moet hier een echte e-mailprovider komen.
        if (process.env.NODE_ENV !== "production") {
          console.log(`[billenboek] OTP voor ${email} (${type}): ${otp}`)
        }
        // TODO: vervang dit door een echte e-mailprovider zoals Resend:
        // await resend.emails.send({ from: "...", to: email, subject: "...", text: `Code: ${otp}` })
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
