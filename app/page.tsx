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
    <div className="bg-white text-gray-800">
      {/* Businesses Section */}
      <div className="pt-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name, category, or tag..."
              value={exploreSearch}
              onChange={(e) => setExploreSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories Section */}
          <div className="bg-white py-12 my-10 rounded-lg shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-blue-900">
                  Categories
                </h2>
                <Link href="/categories" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Explore All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Link href="/categories/Restaurants" className="bg-gray-100 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  Restaurants
                </Link>
                <Link href="/categories/Retail" className="bg-gray-100 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  Retail
                </Link>
                <Link href="/categories/Fashion" className="bg-gray-100 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  Fashion
                </Link>
                <Link href="/categories/Services" className="bg-gray-100 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  Services
                </Link>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-blue-900 mb-8">
            Businesses Near You
          </h1>

          {loading && <p className="text-center">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredBusinesses.map((business) => (
              <div
                key={business.email}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
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
                  <h3 className="text-xl font-semibold text-blue-900">
                    {business.name}
                  </h3>
                  {business.about && (
                    <p className="mt-2 text-gray-600">
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
          <div className="w-full h-[50vh] px-4 py-2 sm:px-6 lg:px-8 fixed left-0 bottom-0 z-[50] bg-blue-100 border-t border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-blue-900">
                Route to {selectedBusiness.name}
              </h2>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="text-2xl text-gray-700 hover:text-gray-900 transition-colors"
              >
                X
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="underline text-blue-600 text-sm hover:text-blue-700 transition-colors"
              >
                See More
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
          <div className="bg-white p-6 rounded-md shadow-lg max-w-3xl w-full overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedBusiness.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-red-500 font-bold text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="mb-2 text-gray-700">
              <strong>About:</strong> {selectedBusiness.about}
            </p>
            <p className="mb-2 text-gray-700">
              <strong>Address:</strong> {selectedBusiness.address}
            </p>
            <p className="mb-2 text-gray-700">
              <strong>Phone:</strong> {selectedBusiness.phone}
            </p>
            <p className="mb-2 text-gray-700">
              <strong>Category:</strong> {selectedBusiness.category}
            </p>
            {selectedBusiness.tags && (
              <p className="mb-4 text-gray-700">
                <strong>Tags:</strong>{" "}
                {Array.isArray(selectedBusiness.tags)
                  ? selectedBusiness.tags.join(", ")
                  : selectedBusiness.tags}
              </p>
            )}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Route Map</h4>
              <MapSection
                mapCenter={mapCenter!}
                userPos={userPos!}
                businessPos={businessPos!}
                selectedBusinessName={selectedBusiness.name}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Products
            </h3>
            <BusinessProducts businessEmail={selectedBusiness.email} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-50 border-t border-gray-300">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                About Us
              </h3>
              <p className="text-gray-700">
                Your premier destination for discovering local businesses.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-blue-600 transition-colors">Categories</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Contact Us
              </h3>
              <p className="text-gray-700">
                Email: info@local-connect.com
              </p>
              <p className="text-gray-700">
                Phone: +234 813 393 2164
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
            <div key={prod.product_id} className="bg-gray-100 p-4 rounded-md shadow">
              <Image
                src={prod.imageUrl || "/placeholder.jpg"}
                alt={prod.name}
                width={400}
                height={300}
                className="w-full h-40 object-cover rounded"
                loader={() => imageLoader(prod.imageUrl)}
              />
              <h4 className="mt-2 font-bold text-gray-800">{prod.name}</h4>
              <p className="text-sm text-gray-600">₦{prod.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
