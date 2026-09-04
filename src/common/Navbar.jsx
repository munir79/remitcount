// src/components/layout/Navbar.jsx
"use client";
import Button from "@/compoent/ui/Button";
import Link from "next/link";

const Navbar = () => {
  return (
    <header className="w-full border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-neutral-900">
          Remit Posh
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;