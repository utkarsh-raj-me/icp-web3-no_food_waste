"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCanister } from "@/lib/context/CanisterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";

export default function ListingsPage() {
  const router = useRouter();
  const { listings, refreshListings } = useCanister();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "expiry">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  const filteredListings = listings
    .filter((listing) => {
      const searchLower = search.toLowerCase();
      return (
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        return sortOrder === "asc"
          ? Number(a.price) - Number(b.price)
          : Number(b.price) - Number(a.price);
      } else {
        return sortOrder === "asc"
          ? Number(a.expiresAt) - Number(b.expiresAt)
          : Number(b.expiresAt) - Number(a.expiresAt);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Available Listings</h1>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSortBy("price")}
                className={sortBy === "price" ? "bg-green-100" : ""}
              >
                Price
                {sortBy === "price" && (
                  <ArrowUpDown
                    className={`ml-2 h-4 w-4 ${
                      sortOrder === "asc" ? "rotate-180" : ""
                    }`}
                  />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSortBy("expiry")}
                className={sortBy === "expiry" ? "bg-green-100" : ""}
              >
                Expiry
                {sortBy === "expiry" && (
                  <ArrowUpDown
                    className={`ml-2 h-4 w-4 ${
                      sortOrder === "asc" ? "rotate-180" : ""
                    }`}
                  />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                <ArrowUpDown
                  className={`h-4 w-4 ${
                    sortOrder === "asc" ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card
              key={listing.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                    {listing.title}
                  </CardTitle>
                  <Badge variant="default">Available</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-lg">
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
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/payment/${listing.id}`)}
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredListings.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No listings found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
