"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useCanister } from "@/lib/context/CanisterContext";

type Listing = {
  id: string;
  name: string;
  description: string;
  price: bigint;
  quantity: bigint;
  unit: string;
  images: string[];
  expiry: bigint;
  seller: { toText: () => string };
  sold: boolean;
};

export default function PaymentContent() {
  const { id } = useParams();
  const router = useRouter();
  const { actor, refreshListings } = useCanister();
  const { principal } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!actor) {
          console.error("Actor not initialized");
          setError("Failed to initialize connection");
          return;
        }

        // Format the listing ID to match backend format
        const listingId = `L${id}`;
        console.log("Fetching listing with ID:", listingId);

        const result = await actor.getListing(listingId);
        console.log("Get listing result:", result);

        if ("ok" in result) {
          setListing({
            id: result.ok.id,
            name: result.ok.title,
            description: result.ok.description,
            price: result.ok.price,
            quantity: result.ok.quantity,
            unit: result.ok.unit,
            images: result.ok.images,
            expiry: result.ok.expiresAt,
            seller: result.ok.seller,
            sold: result.ok.status.Sold !== undefined,
          });
        } else {
          throw new Error(result.err);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setError("Failed to fetch listing details");
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch listing details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [actor, id]);

  const handlePayment = async () => {
    if (!listing || !principal || !actor) {
      toast({
        title: "Error",
        description: "Please connect your wallet to make a purchase",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Attempting purchase with listing ID:", listing.id);
      const result = await actor.createPurchase(listing.id);
      console.log("Purchase result:", result);

      if ("ok" in result) {
        setPaymentStatus("success");
        await refreshListings();
        toast({
          title: "Success!",
          description: "Purchase completed successfully.",
        });
        setTimeout(() => router.push("/profile"), 2000);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentStatus("error");
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => router.push("/listings")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Button>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <Button onClick={() => router.push("/listings")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <div className="relative aspect-video">
            {listing.images[0] && (
              <Image
                src={listing.images[0]}
                alt={listing.name}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          <CardHeader>
            <CardTitle>{listing.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-gray-600">{listing.description}</p>
              <p className="text-lg font-semibold">
                {Number(listing.price) / 100_000_000} ICP
              </p>
              <p className="text-sm text-gray-500">
                Quantity: {listing.quantity.toString()} {listing.unit}
              </p>
              <p className="text-sm text-gray-500">
                Expires:{" "}
                {new Date(
                  Number(listing.expiry) / 1_000_000
                ).toLocaleDateString()}
              </p>
            </div>

            {paymentStatus === "success" ? (
              <div className="flex flex-col items-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-lg font-semibold">Payment Successful!</p>
                <p className="text-gray-600">Redirecting to your profile...</p>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handlePayment}
                disabled={isProcessing || listing.sold || !principal}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : listing.sold ? (
                  "Sold Out"
                ) : !principal ? (
                  "Connect Wallet to Purchase"
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
