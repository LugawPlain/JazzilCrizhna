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
    <div className="flex flex-col h-48 py-4 items-center justify-center px-4 bg-neutral-800">
      <p className="font-light text-neutral-400 text-sm text-center max-w-2xl leading-relaxed">
        Copyright © 2025 Jazzil Crizhna Sarinas. All Rights Reserved.
        <br />
        <span className="text-neutral-500 text-xs">
          All material on this site may not be reproduced, distributed, cached
          or otherwise used, except with prior written permission.
        </span>
      </p>
      <p className="text-neutral-400 text-md mt-4">Need a Website? </p>
      <p className="text-neutral-400 text-md">
        Contact
        <Link href="#">
          {" "}
          <span className="text-neutral-400 underline">YorTech</span>
        </Link>
      </p>
    </div>
  );
};

export default Footer;
