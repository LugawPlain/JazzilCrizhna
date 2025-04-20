import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
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

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        const userEmail = user.email;
        token.id = user.id;

        if (userEmail) {
          const adminEmailsString = process.env.ADMIN_EMAILS || "";
          const adminEmails = adminEmailsString
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email);

          if (adminEmails.includes(userEmail)) {
            token.role = "admin";
          } else {
            token.role = "user";
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
});

export { handler as GET, handler as POST };
