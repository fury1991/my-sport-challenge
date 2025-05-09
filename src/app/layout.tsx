import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Fatty Forward",
  description: "Verfolge die Punkte für deine sportlichen fetten Freunde 🚴‍♂️🏃‍♀️",
  openGraph: {
    title: "Fatty Forward",
    description:
      "Verfolge die Punkte für deine sportlichen fetten Freunde 🚴‍♂️🏃‍♀️",
    url: "https://profurie.de",
    siteName: "Fatty Forward",
    images: [
      {
        url: "/preview.jpg",
        width: 180,
        height: 180,
        alt: "Fatty Forward Vorschau",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
