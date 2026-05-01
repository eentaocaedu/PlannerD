import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Planner D - Gestão de Conteúdo",
  description: "Planejamento mensal de conteúdo para agências e marcas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
