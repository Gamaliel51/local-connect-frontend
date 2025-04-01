"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { backend_url, Business, Product, imageLoader } from "@/utils/data";
import type { Map } from "leaflet";

// Fix window is not defined errors
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

const hideRoutingCSS = `
  .leaflet-routing-container {
    display: none !important;
  }
`;

// Fix useMap hook implementation
const Routing = dynamic(
  () => {
    const { useMap } = require("react-leaflet");
    const L = require("leaflet");
    require("leaflet-routing-machine");
    
    return Promise.resolve(({ userPos, businessPos }: { 
      userPos: [number, number];
      businessPos: [number, number];
    }) => {
      const map = useMap();
      
      useEffect(() => {
        if (!map) return;

        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(userPos[0], userPos[1]),
            L.latLng(businessPos[0], businessPos[1])
          ],
          lineOptions: { styles: [{ color: "#2563eb", weight: 4 }] },
          plan: false,
          createMarker: () => null,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          showAlternatives: false
        }).addTo(map);

        return () => {
          map.removeControl(routingControl);
        };
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

  // Initialize Leaflet markers safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-1.png",
        iconUrl: "/marker-1.png",
        shadowUrl: "/marker-shadow.png",
      });
    }
  }, []);

  useEffect(() => {
    if (businesses.length > 0 && searchParams.has('business')) {
      const businessEmail = searchParams.get('business');
      const business = businesses.find(b => b.email === businessEmail);
      if (business) setSelectedBusiness(business);
    }
  }, [businesses, searchParams]);

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

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    router.push(`?business=${business.email}`, { scroll: false });
  };

  const handleCloseDetails = () => {
    setSelectedBusiness(null);
    router.push(`/categories/${categoryname}`, { scroll: false });
  };

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

 // Calculate positions for map
  const userPos = userLocation ? [userLocation[1], userLocation[0]] as [number, number] : null;
  const businessPos = selectedBusiness?.location ? 
    [selectedBusiness.location[1], selectedBusiness.location[0]] as [number, number] : null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white">
      {/* Businesses Section */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-8">
            {categoryname} Businesses Near You
          </h1>
          
          {loading && <p className="text-center text-gray-800">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businesses.map((business) => (
              <div
                key={business.email}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                onClick={() => handleBusinessSelect(business)}
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
                  <h3 className="text-xl font-semibold text-blue-900">
                    {business.name}
                  </h3>
                  {business.about && (
                    <p className="mt-2 text-gray-600">
                      {business.about.slice(0, 50) + (business.about.length > 50 ? "..." : "")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map & Details Section */}
      {selectedBusiness && userPos && businessPos && (
        <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-blue-900">
              Route to {selectedBusiness.name}
            </h2>
            <button
              onClick={handleCloseDetails}
              className="text-2xl text-gray-500 hover:text-blue-600 transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Map container */}
          <div className="w-full h-[450px] mb-8 rounded-xl overflow-hidden shadow-lg">
            <style>{hideRoutingCSS}</style>
            <MapContainer 
              center={userPos} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
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
              <Routing userPos={userPos} businessPos={businessPos} />
            </MapContainer>
          </div>

          <div className="mb-8 bg-white p-6 rounded-xl shadow">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">
              Business Details
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>About:</strong> {selectedBusiness.about}</p>
              <p><strong>Address:</strong> {selectedBusiness.address}</p>
              <p><strong>Category:</strong> {selectedBusiness.category}</p>
              {selectedBusiness.tags && (
                <p><strong>Tags:</strong> {Array.isArray(selectedBusiness.tags) ? selectedBusiness.tags.join(", ") : selectedBusiness.tags}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      {selectedBusiness && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-2xl font-bold text-blue-900 mb-6">
              Products by {selectedBusiness.name}
            </h3>
            {products.length === 0 ? (
              <p className="text-gray-600">No products found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="bg-blue-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                      <h4 className="font-bold text-blue-900">{product.name}</h4>
                      <p className="text-gray-600">₦{product.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">About Us</h3>
              <p className="text-gray-700">
                Your premier destination for discovering local businesses.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-700">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                <li><Link href="/categories" className="hover:text-blue-600 transition-colors">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Us</h3>
              <p className="text-gray-700">Email: info@local-connect.com</p>
              <p className="text-gray-700">Phone: +234 813 393 2164</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}