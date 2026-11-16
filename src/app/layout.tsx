import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "NAQMIS – Demonstration Prototype",
  description: "National Qualifications Management Information System (academic demonstration prototype).",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
