import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geo Processor",
  description: "UI para procesar puntos geográficos y visualizar centroides y bounds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
