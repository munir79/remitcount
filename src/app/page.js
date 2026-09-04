"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, ShieldCheck, BarChart3, Users } from "lucide-react";
import Navbar from "@/common/Navbar";
import Footer from "@/common/Footer";
import Button from "@/compoent/ui/Button";


const HomePage = () => {
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6 text-neutral-900" />,
      title: "Real-time Financial Analytics",
      description: "Track revenues, expenses, and cash flow in real-time with automatic reporting.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-neutral-900" />,
      title: "Secure & Encrypted",
      description: "Enterprise-grade security ensuring your sensitive financial data remains safe.",
    },
    {
      icon: <Users className="h-6 w-6 text-neutral-900" />,
      title: "Multi-user Access",
      description: "Manage team permissions and collaborate seamlessly with your team.",
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-neutral-900" />
                Modern Accounting Platform
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Manage your business finances with confidence.
              </h1>
              <p className="mt-4 text-base text-neutral-600 sm:text-lg">
                Streamline bookkeeping, generate financial statements, and keep track of your business health all in one seamless workspace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In to Workspace
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image / Illustration Container */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80"
                    alt="Accounting dashboard preview"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-neutral-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Everything you need to grow
              </h2>
              <p className="mt-3 text-base text-neutral-500 max-w-2xl mx-auto">
                Designed for speed, clarity, and precision so you can focus on scale.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 transition-all hover:border-neutral-300 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default HomePage;