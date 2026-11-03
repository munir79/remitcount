import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/reduxProvider/ReduxProvider";
import SocketProvider from "@/socket/SocketProvider";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Toaster richColors position="top-right" closeButton toastOptions={{ className: "font-sans" }} />

        <ReduxProvider>
          <SocketProvider>{children}</SocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
