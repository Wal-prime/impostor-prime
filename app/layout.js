import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Impostor Prime",
  description: "Juego de impostor con amigos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">
              Impostor Prime
            </h1>
          </header>
          <main className="max-w-4xl mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
