"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, FormEvent } from "react";

const Footer = () => {
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    if (!email || !email.includes("@")) {
      // Basic email validation
      setMessage("Please enter a valid email address.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Successfully subscribed!");
        setIsError(false);
        setEmail(""); // Clear email field on success
      } else {
        setMessage(result.message || "Subscription failed. Please try again.");
        setIsError(true);
      }
    } catch (error) {
      console.error("Subscription form error:", error);
      setMessage("An unexpected error occurred. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="bg-neutral-800 text-neutral-200 py-10 px-4 md:px-8">
      {/* Newsletter Section */}
      <div className="max-w-xl mx-auto mb-10 text-center">
        <h3 className="text-xl font-semibold text-white mb-4 font-montserrat">
          Join Our Newsletter
        </h3>
        <p className="text-sm text-neutral-400 mb-5">
          Stay updated with our latest projects, news, and exclusive offers.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-grow px-4 py-2.5 rounded-md bg-neutral-700 text-white border border-neutral-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none placeholder-neutral-400 transition-colors"
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-2.5 rounded-md transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-sm ${
              isError ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Original Footer Content */}
      <div className="pt-10 border-t border-neutral-700 flex flex-col items-center justify-center text-center">
        <p className="font-light text-neutral-400 text-sm lg:text-base max-w-2xl leading-relaxed">
          <span className="inline-block">
            Copyright © 2025 Jazzil Crizhna Sarinas. All Rights Reserved.
          </span>
          <br />
          <span className="inline-block text-neutral-500 text-xs lg:text-sm mt-2">
            All material on this site may not be reproduced, distributed, cached
            or otherwise used, except with prior written permission.
          </span>
        </p>
        <p className="text-neutral-400 text-sm lg:text-base mt-4">
          A Photo of yours have been infringed?
        </p>
        <p className="text-neutral-400 text-sm lg:text-base">
          Contact Us:{" "}
          <Link href="mailto:jazzilcrizhnasarinas04@gmail.com">
            <span className="text-cyan-500 hover:text-cyan-400 underline transition-colors">
              jazzilcrizhnasarinas04@gmail.com
            </span>
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
