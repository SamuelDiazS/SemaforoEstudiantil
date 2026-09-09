import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registro de Llegadas",
  description: "Sistema de registro de llegadas estudiantiles con semáforo",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col sm:max-w-lg md:max-w-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
