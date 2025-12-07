
import '../styles/globals.css';

export const metadata = { title: "RWA Lending DApp" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
