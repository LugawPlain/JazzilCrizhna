import NextAuth, { type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Define an extended Session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      role?: "admin" | "user";
    } & DefaultSession["user"];
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
    async session({ session, token, user }) {
      if (!session.user?.email) {
        return session;
      }

      const adminEmailsString = process.env.ADMIN_EMAILS || "";
      const adminEmails = adminEmailsString
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      if (adminEmails.includes(session.user.email)) {
        session.user.role = "admin";
      } else {
        session.user.role = "user";
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
