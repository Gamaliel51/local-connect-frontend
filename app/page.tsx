"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { backend_url, Business, Product, imageLoader } from "@/utils/data";

// Dynamically import MapSection (only on the client)
const MapSection = dynamic(() => import("@/components/MapSection"), { ssr: false });

export default function Home() {
  const { categoryname } = useParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [businessProducts, setBusinessProducts] = useState<Product[]>([]);
  const [exploreSearch, setExploreSearch] = useState("");

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
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, []);

  // When a business is selected, fetch its products
  useEffect(() => {
    async function fetchProducts() {
      if (selectedBusiness) {
        try {
          const response = await axios.get(
            `${backend_url}/product/by-business/${selectedBusiness.email}`
          );
          setBusinessProducts(response.data.products);
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

  // Filter businesses by search term
  const filteredBusinesses = businesses.filter((biz) => {
    const term = exploreSearch.toLowerCase();
    return (
      biz.name.toLowerCase().includes(term) ||
      (biz.category && biz.category.toLowerCase().includes(term)) ||
      (Array.isArray(biz.tags) && biz.tags.some((t) => t.toLowerCase().includes(term)))
    );
  });

  // Open the modal and set selected business
  const openModal = (biz: Business) => {
    setSelectedBusiness(biz);
    setShowModal(true);
  };

  // Close the modal and clear selected business
  const closeModal = () => {
    setShowModal(false);
    setSelectedBusiness(null);
  };

  return (
    <div>
      {/* Businesses Section */}
      <div className="pt-16 relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-primary-800 dark:text-white mb-8">
            Businesses Near You
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, category, or tag..."
              value={exploreSearch}
              onChange={(e) => setExploreSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {loading && <p className="text-center">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredBusinesses.map((business) => (
              <div
                key={business.email}
                className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                onClick={() => openModal(business)}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Map Section at the bottom */}
      {selectedBusiness &&
        userLocation &&
        selectedBusiness.location &&
        mapCenter &&
        userPos &&
        businessPos && (
          <div className="w-full h-[50vh] px-4 py-2 sm:px-6 lg:px-8 fixed left-0 bottom-0 z-[50] bg-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-primary-800 dark:text-white">
                Route to {selectedBusiness.name}
              </h2>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="text-2xl text-white cursor-pointer"
              >
                X
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="underline text-blue-300 text-sm"
              >
                see more
              </button>
            </div>
            <MapSection
              mapCenter={mapCenter}
              userPos={userPos}
              businessPos={businessPos}
              selectedBusinessName={selectedBusiness.name}
            />
          </div>
        )}

      {/* Modal Popup for Business Details & Products */}
      {showModal && selectedBusiness && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[100]">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg max-w-3xl w-full overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {selectedBusiness.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-red-500 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="mb-2 text-gray-600 dark:text-gray-300">
              <strong>About:</strong> {selectedBusiness.about}
            </p>
            <p className="mb-2 text-gray-600 dark:text-gray-300">
              <strong>Address:</strong> {selectedBusiness.address}
            </p>
            <p className="mb-2 text-gray-600 dark:text-gray-300">
              <strong>Category:</strong> {selectedBusiness.category}
            </p>
            {selectedBusiness.tags && (
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                <strong>Tags:</strong>{" "}
                {Array.isArray(selectedBusiness.tags)
                  ? selectedBusiness.tags.join(", ")
                  : selectedBusiness.tags}
              </p>
            )}
            {/* Optionally, you can add a small map inside the modal as well */}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Route Map</h4>
              <MapSection
                mapCenter={mapCenter!}
                userPos={userPos!}
                businessPos={businessPos!}
                selectedBusinessName={selectedBusiness.name}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Products
            </h3>
            <BusinessProducts businessEmail={selectedBusiness.email} />
          </div>
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
            <Link href="/categories/Restaurants" className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Restaurants
            </Link>
            <Link href="/categories/Retail" className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Retail
            </Link>
            <Link href="/categories/Fashion" className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
              Fashion
            </Link>
            <Link href="/categories/Services" className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg text-center">
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

// Component to fetch and display products for a business in the modal
function BusinessProducts({ businessEmail }: { businessEmail: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    axios
      .get(`${backend_url}/product/by-business/${businessEmail}`)
      .then((res) => {
        setProducts(res.data.products);
      })
      .catch((err) => console.error(err));
  }, [businessEmail]);

  return (
    <div>
      {products.length === 0 ? (
        <p>No products found for this business.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div key={prod.product_id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow">
              <Image
                src={prod.imageUrl || "/placeholder.jpg"}
                alt={prod.name}
                width={400}
                height={300}
                className="w-full h-40 object-cover rounded"
                loader={() => imageLoader(prod.imageUrl)}
              />
              <h4 className="mt-2 font-bold text-gray-800 dark:text-white">{prod.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">₦{prod.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
