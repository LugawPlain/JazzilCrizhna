"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="flex flex-col min-h-40 py-8  items-center justify-center px-4 bg-neutral-800">
      <p className="font-light text-neutral-400 text-sm lg:text-lg text-center max-w-2xl leading-tight">
        <span className="inline-block">
          Copyright © 2025 Jazzil Crizhna Sarinas. All Rights Reserved.
        </span>
        <br />
        <span className="inline-block text-neutral-500 text-xs lg:text-sm mt-2">
          All material on this site may not be reproduced, distributed, cached
          or otherwise used, except with prior written permission.
        </span>
      </p>
      <p className="text-neutral-400 text-sm lg:text-md mt-4 ">
        A Photo of yours have been infringed?{" "}
      </p>
      <p className="text-neutral-400 text-sm lg:text-md mb-8 lg:mb-0">
        Contact Us
        <Link href="mailto:jazzilcrizhnasarinas04@gmail.com">
          <span className="text-xs text-cyan-600 underline">
            JazzilCrizhnaSarinas04@gmail.com
          </span>
        </Link>
      </p>
    </div>
  );
};

export default Footer;
