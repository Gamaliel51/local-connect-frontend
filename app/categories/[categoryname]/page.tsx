"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { backend_url, Business, Product, imageLoader } from "@/utils/data";

// Dynamically import react-leaflet components to disable SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issues
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-1.png",
  iconUrl: "/marker-1.png",
  shadowUrl: "/marker-shadow.png",
});

export default function CategoryPage() {
  const { categoryname } = useParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Get user's current location and fetch businesses by category
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation && categoryname) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userCoords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(userCoords);
          try {
            const response = await axios.post(
              `${backend_url}/business/fetch-by-category`,
              { category: categoryname, location: userCoords },
              { headers: { "Content-Type": "application/json" } }
            );
            setBusinesses(response.data.businesses);
          } catch (err: any) {
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
    }
  }, [categoryname]);

  // When a business is selected, fetch its products
  useEffect(() => {
    async function fetchProducts() {
      if (selectedBusiness) {
        try {
          const response = await axios.get(
            `${backend_url}/product/by-business/${selectedBusiness.email}`
          );
          setProducts(response.data.products);
        } catch (err: any) {
          console.error("Error fetching products:", err);
        }
      }
    }
    fetchProducts();
  }, [selectedBusiness]);

  // Calculate map center and marker positions when a business is selected.
  let mapCenter: [number, number] | null = null;
  let userPos: [number, number] | null = null;
  let businessPos: [number, number] | null = null;
  if (userLocation && selectedBusiness && selectedBusiness.location) {
    const userLat = userLocation[1];
    const userLon = userLocation[0];
    const busLat = selectedBusiness.location[1];
    const busLon = selectedBusiness.location[0];
    mapCenter = [(userLat + busLat) / 2, (userLon + busLon) / 2];
    userPos = [userLat, userLon];
    businessPos = [busLat, busLon];
  }

  return (
    <div>
      {/* Businesses in Category Section */}
      <div className="pt-16 relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-primary-800 dark:text-white mb-8">
            {categoryname} Businesses Near You
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
                  {/* <button className="mt-4 w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">
                    Connect
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map & Details Section for Selected Business */}
      {selectedBusiness && userLocation && selectedBusiness.location && mapCenter && userPos && businessPos && (
        <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-800 dark:text-white mb-4">
            Route to {selectedBusiness.name}
          </h2>
          <div className="w-full h-[450px] mb-8">
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={userPos}>
                <Popup>You are here</Popup>
              </Marker>
              <Marker position={businessPos}>
                <Popup>{selectedBusiness.name}</Popup>
              </Marker>
              <Polyline positions={[userPos, businessPos]} color="blue" />
            </MapContainer>
          </div>

          {/* Business Details Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-primary-800 dark:text-white mb-4">
              Business Details
            </h3>
            <p>
              <strong>About:</strong> {selectedBusiness.about}
            </p>
            <p>
              <strong>Address:</strong> {selectedBusiness.address}
            </p>
            <p>
              <strong>Category:</strong> {selectedBusiness.category}
            </p>
            {selectedBusiness.tags && (
              <p>
                <strong>Tags:</strong>{" "}
                {Array.isArray(selectedBusiness.tags)
                  ? selectedBusiness.tags.join(", ")
                  : selectedBusiness.tags}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Products Section */}
      {selectedBusiness && (
        <div className="mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-primary-800 dark:text-white mb-4">
            Products by {selectedBusiness.name}
          </h3>
          {products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
                >
                  <Image
                    loader={() => imageLoader(product.imageUrl)}
                    src={product.imageUrl || "/placeholder.jpg"}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-primary-800 dark:text-white">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        ₦{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                Phone: +2348133932164
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
