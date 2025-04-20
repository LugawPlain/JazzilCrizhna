"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp"; // Adjust path if needed
import { useAuth } from "@/context/AuthContext"; // Adjust path if needed

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect to home page after successful login
    } catch (err: any) {
      // Catch specific Firebase errors if needed
      console.error("Login error:", err);
      setError(err.message || "Failed to log in.");
    }
  };

  // If user is already logged in or loading, don't show login form
  // You might want a loading indicator here instead of null
  if (loading) return <div>Loading...</div>;
  if (user) {
    // Optional: Redirect if already logged in
    // useEffect(() => { router.push('/'); }, [router]);
    return <div>Already logged in. Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="bg-neutral-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Login
        </h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Login
          </button>
        </form>
        {/* Optional: Add link to Sign Up page */}
        {/* <p className="text-center text-gray-400 mt-4">
          Don't have an account? <a href="/signup" className="text-pink-500 hover:underline">Sign up</a>
        </p> */}
      </div>
    </div>
  );
}
