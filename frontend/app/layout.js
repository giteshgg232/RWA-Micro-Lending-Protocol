import "../styles/globals.css";
import Footer from "../components/Footer";

export const metadata = {
  title: "RWA Lending DApp",
  description: "Decentralized invoice-backed lending protocol",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        <Footer />

      </body>
    </html>
  );
}
