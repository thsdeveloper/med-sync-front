import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
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
        className={`${inter.variable} ${montserrat.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
