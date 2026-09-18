import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Raas Mahotsav — Dussehra Dandiya Celebration",
  description: "Rang · Raas · Dhamaka — three nights of Dandiya at Royal Palace. Book your entry pass.",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
