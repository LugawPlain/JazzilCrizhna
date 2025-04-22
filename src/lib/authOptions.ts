import type { DefaultSession, AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

// Define an extended Session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      role?: "admin" | "user";
      id?: string;
    } & DefaultSession["user"];
  }
}

// Define an extended JWT type
declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "user";
    id?: string;
  }
}

// Define and export the configuration object
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Only log on actual sign-ins, not token refreshes
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auth] User sign-in: ${user.email}`);
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Only log detailed information during initial sign-in
      if (user && account) {
        token.id = user.id;
        const userEmail = user.email;

        if (userEmail) {
          const adminEmailsString = process.env.ADMIN_EMAILS || "";
          const adminEmails = adminEmailsString
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email);

          const isAdmin = adminEmails.includes(userEmail);

          if (isAdmin) {
            token.role = "admin";
          } else {
            token.role = "user";
          }

          // Only log role assignment during initial sign-in
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[Auth] User ${userEmail} assigned role: ${token.role}`
            );
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    },
  },
};
