import type { DefaultSession, AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// --- Logging Environment Variables at startup ---
// console.log("[AuthOptions] Reading Environment Variables:");
// console.log(
//   `[AuthOptions] GOOGLE_CLIENT_ID: ${
//     process.env.GOOGLE_CLIENT_ID ? "Set" : "Not Set"
//   }`
// );
// // Avoid logging the actual secret
// console.log(
//   `[AuthOptions] GOOGLE_CLIENT_SECRET: ${
//     process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not Set"
//   }`
// );
// console.log(
//   `[AuthOptions] NEXTAUTH_SECRET: ${
//     process.env.NEXTAUTH_SECRET ? "Set" : "Not Set"
//   }`
// );
// console.log(
//   `[AuthOptions] NEXTAUTH_URL: ${
//     process.env.NEXTAUTH_URL || "Not Set - Will be inferred"
//   }`
// );
// console.log(
//   `[AuthOptions] ADMIN_EMAILS: ${process.env.ADMIN_EMAILS || "Not Set"}`
// );
// console.log(`[AuthOptions] NODE_ENV: ${process.env.NODE_ENV}`);
// --- End Logging ---

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
    async signIn({ user, account }) {
      // Added more parameters to log
      // console.log("[AuthCallback] signIn: Reached");
      // console.log(`[AuthCallback] signIn: User Email: ${user?.email}`);
      // console.log(
      //   `[AuthCallback] signIn: Account Provider: ${account?.provider}`
      // );
      // Avoid logging full credentials object if sensitive
      // console.log("[AuthCallback] signIn: Credentials:", credentials);
      return true; // Original logic
    },
    async jwt({ token, user, account }) {
      // Added more parameters to log
      // console.log("[AuthCallback] jwt: Reached");
      // console.log(
      //   `[AuthCallback] jwt: Token incoming: ${JSON.stringify(token)}`
      // );
      // Only log detailed information during initial sign-in
      if (user && account) {
        // console.log(
        //   `[AuthCallback] jwt: Initial sign-in detected for user: ${user.email}`
        // );
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
            // console.log(
            //   `[Auth] User ${userEmail} assigned role: ${token.role}`
            // );
          }
        }
      }
      // console.log(
      //   `[AuthCallback] jwt: Token outgoing: ${JSON.stringify(token)}`
      // );
      return token;
    },
    async session({ session, token }) {
      // Added more parameters to log
      // console.log("[AuthCallback] session: Reached");
      // console.log(
      //   `[AuthCallback] session: Token used: ${JSON.stringify(token)}`
      // );
      session.user.role = token.role;
      session.user.id = token.id;
      // console.log(
      //   `[AuthCallback] session: Session outgoing: ${JSON.stringify(session)}`
      // );
      return session;
    },
  },
};
