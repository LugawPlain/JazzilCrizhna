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
    async signIn({ user, account, profile, email, credentials }) {
      console.log("--- [SignIn Callback] --- Triggered ---");
      console.log("[SignIn Callback] User:", JSON.stringify(user, null, 2));
      console.log(
        "[SignIn Callback] Account:",
        JSON.stringify(account, null, 2)
      );
      console.log(
        "[SignIn Callback] Profile:",
        JSON.stringify(profile, null, 2)
      );
      // We don't need to modify anything here, just log.
      // Returning true allows the sign-in to proceed.
      return true;
    },
    async jwt({ token, user, account, profile }) {
      console.log("[JWT Callback] Triggered");
      if (user && account) {
        console.log("[JWT Callback] Initial sign in or update");
        token.id = user.id;
        const userEmail = user.email;
        console.log("[JWT Callback] User Email:", userEmail);

        if (userEmail) {
          // --- Restoring Original Env Var Check ---
          const adminEmailsString = process.env.ADMIN_EMAILS || "";
          console.log(
            "[JWT Callback] ADMIN_EMAILS env var:",
            adminEmailsString
          );

          const adminEmails = adminEmailsString
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email);
          console.log("[JWT Callback] Parsed Admin Emails Array:", adminEmails);

          const isAdmin = adminEmails.includes(userEmail);
          console.log(`[JWT Callback] Is ${userEmail} in admin list?`, isAdmin);
          // --- End Original Env Var Check ---

          if (isAdmin) {
            token.role = "admin";
          } else {
            token.role = "user";
          }
          console.log("[JWT Callback] Assigned token.role:", token.role);
        } else {
          console.log("[JWT Callback] No user email found.");
        }
      } else {
        console.log(
          "[JWT Callback] Not initial sign in, returning existing token."
        );
      }
      console.log("[JWT Callback] Returning token:", token);
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
