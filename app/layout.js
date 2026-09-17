import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "EventHub",
  description: "Event ticketing, made simple.",
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
