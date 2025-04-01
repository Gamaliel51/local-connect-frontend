"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { backend_url, Business, Product, imageLoader } from "@/utils/data";

// Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Leaflet configuration
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-1.png",
  iconUrl: "/marker-1.png",
  shadowUrl: "/marker-shadow.png",
});

const hideRoutingCSS = `
  .leaflet-routing-container {
    display: none !important;
  }
`;

// Routing component
const Routing = dynamic(
  () => {
    const { useMap } = require("react-leaflet");
    const L = require("leaflet");
    
    return Promise.resolve(({ userPos, businessPos }: { 
      userPos: [number, number];
      businessPos: [number, number];
    }) => {
      const map = useMap();

      useEffect(() => {
        if (!map || !userPos || !businessPos) return;

        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(userPos[0], userPos[1]),
            L.latLng(businessPos[0], businessPos[1])
          ],
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1"
          }),
          lineOptions: {
            styles: [{ color: "#2563eb", weight: 4 }],
            extendToWaypoints: true,
            missingRouteTolerance: 1
          },
          show: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true
        }).addTo(map);

        return () => map.removeControl(routingControl);
      }, [map, userPos, businessPos]);

      return null;
    });
  },
  { ssr: false }
);

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categoryname } = useParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Load initial business from URL
  useEffect(() => {
    if (businesses.length > 0 && searchParams.has('business')) {
      const businessEmail = searchParams.get('business');
      const business = businesses.find(b => b.email === businessEmail);
      if (business) setSelectedBusiness(business);
    }
  }, [businesses, searchParams]);

  // Fetch businesses
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

  // Business selection handlers
  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    router.push(`?business=${business.email}`, { scroll: false });
  };

  const handleCloseDetails = () => {
    setSelectedBusiness(null);
    router.push(`/categories/${categoryname}`, { scroll: false });
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
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
    };
    fetchProducts();
  }, [selectedBusiness]);

  // Position conversions
  const userPos = userLocation ? [userLocation[1], userLocation[0]] as [number, number] : null;
  const businessPos = selectedBusiness?.location ? 
    [selectedBusiness.location[1], selectedBusiness.location[0]] as [number, number] : null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {/* Business List Section */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">
            {decodeURIComponent(categoryname as string)} Businesses
          </h1>

          {loading && <p className="text-center text-blue-600">Loading businesses...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businesses.map((business) => (
              <div
                key={business.email}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleBusinessSelect(business)}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={business.profileImageUrl || "/placeholder.jpg"}
                    alt={business.name}
                    loader={business.profileImageUrl ? () => imageLoader(business.profileImageUrl) : undefined}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    {business.name}
                  </h3>
                  {business.about && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {business.about}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Business Section */}
      {selectedBusiness && userPos && businessPos && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-blue-900 mb-2">
                  {selectedBusiness.name}
                </h2>
                <p className="text-gray-600">{selectedBusiness.address}</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-2xl text-gray-400 hover:text-blue-600 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Map Container */}
            <div className="mb-8">
              <style>{hideRoutingCSS}</style>
              <div className="h-96 w-full rounded-lg overflow-hidden">
                <MapContainer
                  center={userPos}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={userPos}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <Marker position={businessPos}>
                    <Popup>{selectedBusiness.name}</Popup>
                  </Marker>
                  <Routing userPos={userPos} businessPos={businessPos} />
                </MapContainer>
              </div>
            </div>

            {/* Business Details */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">About</h3>
              <p className="text-gray-600 leading-relaxed">
                {selectedBusiness.about}
              </p>
            </div>

            {/* Products */}
            {products.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-blue-900 mb-6">Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.product_id}
                      className="bg-blue-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={product.imageUrl || "/placeholder.jpg"}
                          alt={product.name}
                          loader={product.imageUrl ? () => imageLoader(product.imageUrl) : undefined}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          {product.name}
                        </h4>
                        <p className="text-gray-600">
                          ₦{product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-50 border-t border-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">About Us</h3>
              <p className="text-gray-600">
                Connecting communities with local businesses
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact</h3>
              <p className="text-gray-600">support@localconnect.com</p>
              <p className="text-gray-600">+234 800 000 0000</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}