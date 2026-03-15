import type { Metadata } from "next";
import { Noto_Sans, Figtree } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { Analytics } from '@vercel/analytics/next';

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedSync - Gestão de Escalas Inteligente",
  description: "O fim da confusão nos plantões. Organize horários, troque turnos e passe o plantão com Inteligência Artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body
        className={`${notoSans.variable} ${figtree.variable} antialiased bg-teal-50 text-teal-900`}
      >
        <AppProviders>
          {children}
          <Analytics />
        </AppProviders>
      </body>
    </html>
  );
}
