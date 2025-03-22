"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { foodWasteClient } from "@/lib/services/food-waste.service";
import { useApp } from "@/lib/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/lib/AuthContext";
import { Upload } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 5;

type Unit = "kg" | "g" | "pieces" | "litres" | "ml";

export default function CreateListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUserData, refreshListings } = useApp();
  const { principal } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [expiryTime, setExpiryTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");

  const validateImage = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload JPEG, PNG, or WebP images.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size too large. Maximum size is 5MB.";
    }
    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validationErrors = newFiles
        .map(validateImage)
        .filter((error) => error !== null);
      if (validationErrors.length > 0) {
        toast({
          title: "Error",
          description: validationErrors[0],
          variant: "destructive",
        });
        return;
      }
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setImages((prev) => {
        const updatedImages = [...prev, ...newUrls];
        if (updatedImages.length > MAX_IMAGES) {
          toast({
            title: "Error",
            description: `You can only upload up to ${MAX_IMAGES} images.`,
            variant: "destructive",
          });
          return prev;
        }
        return updatedImages;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prevImages) => {
      URL.revokeObjectURL(prevImages[index]);
      return prevImages.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const priceInE8s = BigInt(Math.floor(parseFloat(price) * 100_000_000));
      const quantityBigInt = BigInt(parseInt(quantity));
      const expiryTimeBigInt = BigInt(
        new Date(expiryTime).getTime() * 1_000_000
      );

      const result = await foodWasteClient.createListing(
        title,
        description,
        priceInE8s,
        quantityBigInt,
        unit,
        images,
        expiryTimeBigInt
      );

      if ("ok" in result) {
        toast({
          title: "Success!",
          description: "Listing created successfully.",
        });
        await Promise.all([refreshListings(), refreshUserData()]);
        router.push("/listings");
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Failed to create listing:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create listing.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!principal) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Authentication Required
          </h2>
          <p className="text-gray-600 mt-2">
            Please connect your wallet to create a listing
          </p>
          <Button
            onClick={() => router.push("/")}
            className="mt-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Listing
          </h1>
          <p className="mt-2 text-gray-600">
            Share your food items with the community and reduce waste
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Fresh Organic Vegetables"
                  required
                  maxLength={100}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your food items, quantity, and condition..."
                  required
                  maxLength={1000}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (ICP)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.00000001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                    <Select
                      value={unit}
                      onValueChange={(value: Unit) => setUnit(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="litres">Litres (L)</SelectItem>
                        <SelectItem value="ml">Millilitres (ml)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Expiry Time</Label>
                  <Input
                    type="datetime-local"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Images ({images.length}/{MAX_IMAGES})
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center">
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500 mt-2">
                          Add Image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                          multiple
                        />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Upload up to 5 images (PNG, JPG, JPEG)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                disabled={isSubmitting || !expiryTime || images.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
