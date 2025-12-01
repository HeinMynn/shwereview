import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ShweReview - Discover & Review Businesses",
  description: "Find the best local businesses and share your experiences.",
};

import VerificationBanner from "@/components/VerificationBanner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <VerificationBanner />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
