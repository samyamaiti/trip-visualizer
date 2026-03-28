import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Visualizer",
  description: "Upload a PDF or DOCX itinerary and view a mapped travel plan."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
