"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { storageService } from "@/lib/services/storage.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { principal } = useAuthContext();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalListings: number;
    activeListings: number;
    totalPurchases: number;
  }>({
    totalListings: 0,
    activeListings: 0,
    totalPurchases: 0,
  });
  const [listings, setListings] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!principal) {
      router.push("/");
      return;
    }

    const userId = principal.toString();
    const userStats = storageService.getUserStats(userId);
    setStats(userStats);

    const userListings = storageService
      .getListings()
      .filter((l) => l.seller.toString() === userId);
    setListings(userListings);

    const userPurchases = storageService.getPurchases(userId);
    setPurchases(userPurchases);
  }, [principal, router]);

  if (!principal) {
    return null;
  }

  const principalId = principal.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${principalId}`}
            />
            <AvatarFallback>
              {principalId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-gray-600">Principal ID: {principalId}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalListings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.activeListings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalPurchases}</p>
            </CardContent>
          </Card>
        </div>

        {/* Your Listings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{listing.title}</CardTitle>
                    <Badge
                      variant={!listing.status.Active ? "secondary" : "default"}
                    >
                      {!listing.status.Active ? "Sold" : "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-600 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">
                        {Number(listing.price) / 100_000_000} ICP
                      </p>
                      <p className="text-sm text-gray-500">
                        {listing.quantity.toString()} {listing.unit}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Expires:{" "}
                      {new Date(
                        Number(listing.expiresAt) / 1_000_000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {listings.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No listings found</p>
              </div>
            )}
          </div>
        </div>

        {/* Your Purchases */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Purchases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Purchase #{purchase.id}
                  </CardTitle>
                  <Badge variant="secondary">Completed</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Quantity: {purchase.quantity.toString()} {purchase.unit}
                    </p>
                    <p className="font-semibold">
                      {Number(purchase.price) / 100_000_000} ICP
                    </p>
                    <p className="text-sm text-gray-500">
                      Purchased on:{" "}
                      {new Date(
                        Number(purchase.createdAt) / 1_000_000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {purchases.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No purchases found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
