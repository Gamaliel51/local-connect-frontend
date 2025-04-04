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
      {/* Hero Section*/}
      <section className="bg-blue-600 h-[90vh] py-20 mt-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-white font-bold text-5xl leading-tight mb-6">
                Find & Explore with Businesses Right next to you
              </h1>
              <p className="text-white text-xl mb-8">
                Discover top-rated shops, restaurants, and services in your community. Experience personalized connections and support local growth.
              </p>
              <Link href="/register" rel="noopener noreferrer"
                  className="relative w-36 flex items-center justify-center px-6 py-3 bg-white hover:bg-blue-900 hover:text-white text-blue-900 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <span className="absolute inset-0 rounded-full bg-white opacity-50 animate-ping"></span>
                  <span className="relative z-10 pr-2">Sign Up</span>
              </Link>
            </div>
            <div className="md:w-1/2">
              <Image
                src="https://rin.org.uk/resource/resmgr/nav21/nav21_map.png"
                alt="Local Connect connecting users to nearby businesses"
                width={600}
                height={400}
                className="w-full rounded-lg shadow-lg"
                unoptimized
              />
            </div>
          </div>
        </div>
        <div className="absolute sm:bottom-14 bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <a href="#explore" className="cursor-pointer">
               <p className="w-28 mx-auto text-center text-white">Explore Now</p>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </a>
        </div>
      </section>

      {/* Businesses Section */}
      <div id="explore" className="pt-16 bg-gradient-to-br from-blue-50 to-white">
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
                <Link href="/categories/Restaurants" className="bg-gray-100 py-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  <Image
                    src="https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Local Connect connecting users to nearby businesses"
                    width={300}
                    height={200}
                    className="w-8/12 mx-auto rounded-lg shadow-lg mb-4"
                    unoptimized
                  />
                  Restaurants
                </Link>
                <Link href="/categories/Retail" className="bg-gray-100 py-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  <Image
                    src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmV0YWlsJTIwc3RvcmV8ZW58MHx8MHx8fDA%3D"
                    alt="Local Connect connecting users to nearby businesses"
                    width={300}
                    height={200}
                    className="w-8/12 mx-auto rounded-lg shadow-lg mb-4"
                    unoptimized
                  />
                  Retail
                </Link>
                <Link href="/categories/Fashion" className="bg-gray-100 py-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  <Image
                    src="https://img.freepik.com/free-photo/shop-clothing-clothes-shop-hanger-modern-shop-boutique_1150-8886.jpg?semt=ais_hybrid&w=740"
                    alt="Local Connect connecting users to nearby businesses"
                    width={300}
                    height={200}
                    className="w-8/12 mx-auto rounded-lg shadow-lg mb-4"
                    unoptimized
                  />
                  Fashion
                </Link>
                <Link href="/categories/Services" className="bg-gray-100 py-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  <Image
                    src="https://media.istockphoto.com/id/1387250100/photo/a-happy-customer-paying-at-checkout-with-credit-card-in-supermarket.jpg?s=612x612&w=0&k=20&c=HvOOgZLEtpv9StMXoJteDdWZW1cjH0NJi6K61_DoZxk="
                    alt="Local Connect connecting users to nearby businesses"
                    width={300}
                    height={200}
                    className="w-8/12 mx-auto rounded-lg shadow-lg mb-4"
                    unoptimized
                  />
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
