import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // You can add callbacks here if needed, e.g., to store user info in a database
  // callbacks: {
  //   async session({ session, token, user }) {
  //     // Send properties to the client, like an access_token.
  //     return session
  //   },
  //   async jwt({ token, account }) {
  //     // Persist the OAuth access_token to the token right after signin
  //     if (account) {
  //       token.accessToken = account.access_token
  //     }
  //     return token
  //   }
  // }
});

export { handler as GET, handler as POST };
