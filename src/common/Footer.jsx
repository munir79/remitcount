// src/components/layout/Footer.jsx
"use client";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <Link href="/" className="text-lg font-bold text-neutral-900">
          Remit Posh
            </Link>
            <p className="mt-1 text-xs text-neutral-500">
              © {new Date().getFullYear()} Remit Posh. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="/login" className="hover:text-neutral-900">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-neutral-900">
              Sign Up
            </Link>
            <Link href="#" className="hover:text-neutral-900">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-neutral-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;