import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";
import { Suspense } from "react";
import { shadcn } from "@clerk/themes";
import { Spinner } from "@/components/ui/spinner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Expense tracker with CSV imports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <Suspense
          fallback={
            <main className="flex min-h-[50vh] w-full items-center justify-center">
              <Spinner className="size-8" />
            </main>
          }
        >
          <ClerkProvider
            appearance={{
              theme: shadcn,
            }}
          >
            <Navbar />
            {children}
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
