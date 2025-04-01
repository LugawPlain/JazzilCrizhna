"use client";
import { useState } from "react";
import TiktokIcon from "./icons/TiktokIcon";

const SocialLinksButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const socialLinks = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
        />
      ),
      href: "#facebook",
    },
    {
      icon: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 4H8C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16.5 7.5V7.501"
          />
        </>
      ),
      href: "#instagram",
    },
    {
      icon: (
        <>
          <TiktokIcon></TiktokIcon>
        </>
      ),
      href: "#tiktok",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      ),
      href: "mailto:contact@example.com",
    },
  ];

  return (
    <>
      <div className="fixed right-8 bottom-8 z-50">
        {/* Social Media Icons */}
        <div className="flex flex-col-reverse gap-4 mb-4">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={`flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all group duration-300 absolute ${
                !isOpen && "pointer-events-none"
              }`}
              style={{
                transform: isOpen
                  ? `translateY(${-60 * (index + 1)}px)`
                  : "translateY(0px)",
                opacity: isOpen ? 1 : 0,
                transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  index * 0.1
                }s, opacity 0.5s ease-out ${index * 0.1}s`,
                bottom: "0",
                right: "0",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white group-hover:motion-preset-shake"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {link.icon}
              </svg>
            </a>
          ))}
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 group relative z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-white transition-transform duration-500 group-hover:motion-preset-shake ${
              isOpen ? "rotate-45" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default SocialLinksButton;
