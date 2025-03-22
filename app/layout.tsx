import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import { AppProvider } from "@/lib/AppContext";
import Navigation from "@/components/Navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { CanisterProvider } from "@/lib/context/CanisterContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Waste Reduction",
  description:
    "A platform to reduce food waste by connecting buyers and sellers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CanisterProvider>
            <AppProvider>
              <RouteGuard>
                <Navigation />
                {children}
                <Toaster />
              </RouteGuard>
            </AppProvider>
          </CanisterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
