import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leitor de inglês",
  description: "Leia PDFs em inglês e traduza palavras e frases selecionadas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
