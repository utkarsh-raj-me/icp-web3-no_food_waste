"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, login, logout } = useAuthContext();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-green-600">
                FoodWaste
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {pathname !== "/listings" && (
                <Link
                  href="/listings"
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Browse Listings
                </Link>
              )}
              {isAuthenticated && (
                <>
                  {pathname !== "/create-listing" && (
                    <Link
                      href="/create-listing"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    >
                      Create Listing
                    </Link>
                  )}
                  {pathname !== "/profile" && (
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    >
                      Profile
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                onClick={logout}
                className="ml-4 text-gray-500"
              >
                Logout
              </Button>
            ) : (
              <Button
                onClick={login}
                className="ml-4 bg-green-600 text-white hover:bg-green-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
