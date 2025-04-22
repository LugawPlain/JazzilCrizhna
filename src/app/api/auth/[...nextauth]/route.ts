import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions"; // <-- Import from the new location

// Create the handler using the imported options
const handler = NextAuth(authOptions);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST };
