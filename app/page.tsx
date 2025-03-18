"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { backend_url, Business, imageLoader } from "@/utils/data";

// Dynamically import the MapSection so it only loads on the client side.
const MapSection = dynamic(() => import("@/components/MapSection"), { ssr: false });

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Get user's current location and fetch nearby businesses
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userCoords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(userCoords);
          try {
            const response = await axios.post(
              `${backend_url}/business/fetch-nearby`,
              { location: userCoords },
              { headers: { "Content-Type": "application/json" } }
            );
            setBusinesses(response.data.businesses);
          } catch (err: any) {
            console.error("Error fetching businesses:", err);
            setError(err.response?.data?.error || err.message);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError("Geolocation permission denied or unavailable.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, []);

  // Calculate map center and positions when a business is selected.
  let mapCenter: [number, number] | null = null;
  let userPos: [number, number] | null = null;
  let businessPos: [number, number] | null = null;
  if (userLocation && selectedBusiness && selectedBusiness.location) {
    const userLat = userLocation[1];
    const userLon = userLocation[0];
    const businessLat = selectedBusiness.location[1];
    const businessLon = selectedBusiness.location[0];
    mapCenter = [(userLat + businessLat) / 2, (userLon + businessLon) / 2];
    userPos = [userLat, userLon];
    businessPos = [businessLat, businessLon];
  }

  return (
    <div>
      {/* Businesses Section */}
      <div className="pt-16 relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-primary-800 dark:text-white mb-8">
            Businesses Near You
          </h1>
          {loading && <p className="text-center">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businesses.map((business) => (
              <div
                key={business.email}
                className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                onClick={() => setSelectedBusiness(business)}
              >
                <Image
                  src={business.profileImageUrl || "/placeholder.jpg"}
                  alt={business.name}
                  loader={() => imageLoader(business.profileImageUrl)}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary-800 dark:text-white">
                    {business.name}
                  </h3>
                  {business.about && (
                    <p className="mt-2 text-primary-600">
                      {business.about.length > 50
                        ? business.about.slice(0, 50) + "..."
                        : business.about}
                    </p>
                  )}
                  <button className="mt-4 w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      {selectedBusiness &&
        userLocation &&
        selectedBusiness.location &&
        mapCenter &&
        userPos &&
        businessPos && (
          <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary-800 dark:text-white mb-4">
              Route to {selectedBusiness.name}
            </h2>
            <MapSection
              mapCenter={mapCenter}
              userPos={userPos}
              businessPos={businessPos}
              selectedBusinessName={selectedBusiness.name}
            />
          </div>
        )}

      {/* Categories Section */}
      <div className="bg-white dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary-800 dark:text-white">
              Categories
            </h2>
            <Link href="/categories" className="text-primary-500 hover:text-primary-600">
              Explore All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href={`/categories/Restaurants`} className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Restaurants
            </Link>
            <Link href={`/categories/Retail`} className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Retail
            </Link>
            <Link href={`/categories/Fashion`} className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Fashion
            </Link>
            <Link href={`/categories/Services`} className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Services
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">
                About Us
              </h3>
              <p className="text-primary-700 dark:text-gray-300">
                Your premier destination for discovering local businesses.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-primary-700 dark:text-gray-300">
                <li className="hover:text-primary-500 transition-colors">Home</li>
                <li className="hover:text-primary-500 transition-colors">Shop</li>
                <li className="hover:text-primary-500 transition-colors">Categories</li>
                <li className="hover:text-primary-500 transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">
                Contact Us
              </h3>
              <p className="text-primary-700 dark:text-gray-300">
                Email: info@local-connect.com
              </p>
              <p className="text-primary-700 dark:text-gray-300">
                Phone: (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
