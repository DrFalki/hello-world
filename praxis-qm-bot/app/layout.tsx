import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "QM-Assistent Praxis",
  description: "KI-Chat über das Qualitätsmanagement-Handbuch der Praxis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <html lang="de">
        <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold">
                🩺 QM-Assistent
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <SignedIn>
                  <Link href="/admin/upload" className="text-slate-600 hover:text-slate-900">
                    Admin
                  </Link>
                  <UserButton afterSignOutUrl="/sign-in" />
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="text-slate-600 hover:text-slate-900">
                    Login
                  </Link>
                </SignedOut>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
