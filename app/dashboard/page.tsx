"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backend_url, Business, Product, Order, User, imageLoader } from "@/utils/data";
import dynamic from "next/dynamic";

// Dynamically import MapSection (only on the client)
const MapSection = dynamic(() => import("@/components/MapSection"), { ssr: false });

// Helper functions to get/set cart in localStorage keyed by email
const getCart = (email: string): Product[] => {
  if (typeof window !== "undefined") {
    const cartStr = localStorage.getItem(`cart_${email}`);
    return cartStr ? JSON.parse(cartStr) : [];
  }
  return [];
};
const setCart = (email: string, cart: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`cart_${email}`, JSON.stringify(cart));
  }
};

export default function UserDashboard() {
  const router = useRouter();

  // Tabs: "explore", "search", "cart", "orders", "profile"
  const [activeTab, setActiveTab] = useState("explore");

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Explore: nearby businesses state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [exploreSearch, setExploreSearch] = useState("");

  // Search Products state
  const [searchTagInput, setSearchTagInput] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Modal state for viewing a business’s details and products
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessProducts, setBusinessProducts] = useState<Product[]>([]);

  // Cart state
  const [cart, setCartState] = useState<Product[]>([]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    address: "",
    profileImage: null as File | null,
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [globalError, setGlobalError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");

  // On mount: check sessionStorage and load user info, cart, orders, and user location.
  useEffect(() => {
    const t = sessionStorage.getItem("token");
    const email = sessionStorage.getItem("email");
    if (!t || !email) {
      router.push("/login");
      return;
    }
    setToken(t);
    setUserEmail(email);

    // Fetch user profile info
    axios
      .get(`${backend_url}/user/profile`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        setUser(res.data.user);
        setProfileForm({
          name: res.data.user.name || "",
          address: res.data.user.address || "",
          profileImage: null,
        });
      })
      .catch((err) => {
        setGlobalError(err.response?.data?.error || err.message);
      });

    // Load cart from localStorage
    setCartState(getCart(email));

    // Fetch orders
    axios
      .get(`${backend_url}/order/user/${email}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        setOrders(res.data.orders);
        setOrdersLoading(false);
      })
      .catch((err) => {
        setGlobalError(err.response?.data?.error || err.message);
        setOrdersLoading(false);
      });

    // Get user's geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(coords);
          // Fetch nearby businesses
          axios
            .post(
              `${backend_url}/business/fetch-nearby`,
              { location: coords },
              { headers: { "Content-Type": "application/json" } }
            )
            .then((res) => {
              setBusinesses(res.data.businesses);
            })
            .catch((err) => {
              setGlobalError(err.response?.data?.error || err.message);
            });
        },
        () => {
          setGlobalError("Geolocation permission denied or unavailable.");
        }
      );
    }
  }, [router]);

  // Explore: filter businesses by search term
  const filteredBusinesses = businesses.filter((biz) => {
    const term = exploreSearch.toLowerCase();
    return (
      biz.name.toLowerCase().includes(term) ||
      (biz.category && biz.category.toLowerCase().includes(term)) ||
      (Array.isArray(biz.tags) && biz.tags.some((t) => t.toLowerCase().includes(term)))
    );
  });

  // Handler: Open business modal to view details & products
  const openBusinessModal = (biz: Business) => {
    setSelectedBusiness(biz);
    axios
      .get(`${backend_url}/product/by-business/${biz.email}`)
      .then((res) => {
        setBusinessProducts(res.data.products);
        setShowBusinessModal(true);
      })
      .catch((err) => console.error(err));
  };

  // Handler: Update user profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    const formData = new FormData();
    formData.append("name", profileForm.name);
    formData.append("address", profileForm.address);
    if (profileForm.profileImage) {
      formData.append("profileImage", profileForm.profileImage);
    }
    try {
      const res = await axios.put(`${backend_url}/user/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      setProfileMessage("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.response?.data?.error || err.message);
    }
  };

  // Handler: Add product to cart
  const handleAddToCart = (product: Product) => {
    if (!userEmail) return;
    const currentCart = getCart(userEmail);
    const updatedCart = [...currentCart, product];
    setCart(userEmail, updatedCart);
    setCartState(updatedCart);
  };

  // Handler: Remove product from cart
  const handleRemoveFromCart = (productId: string) => {
    if (!userEmail) return;
    const currentCart = getCart(userEmail);
    const updatedCart = currentCart.filter((p: Product) => p.product_id !== productId);
    setCart(userEmail, updatedCart);
    setCartState(updatedCart);
  };

  // Handler: Checkout cart – create orders grouped by business
  const handleCheckout = async () => {
    if (!userEmail || cart.length === 0) return;
    const grouped: { [key: string]: Product[] } = {};
    cart.forEach((p: Product) => {
      grouped[p.business_owned] = grouped[p.business_owned] || [];
      grouped[p.business_owned].push(p);
    });
    try {
      const orderPromises = Object.keys(grouped).map((bizEmail) => {
        return axios.post(
          `${backend_url}/order/create`,
          {
            business_owned: bizEmail,
            product_list: grouped[bizEmail].map((p) => p.product_id),
            collection_method: "onsite",
            customer_notes: [],
          },
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
      });
      await Promise.all(orderPromises);
      setCart(userEmail, []);
      setCartState([]);
      setGlobalMessage("Order placed successfully.");
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
    }
  };

  // Handler: Search products by tags
  const handleProductSearch = async () => {
    if (searchTags.length === 0) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await axios.post(
        `${backend_url}/product/products-search`,
        { tags: searchTags },
        { headers: { "Content-Type": "application/json" } }
      );
      setSearchResults(res.data.products);
    } catch (err: any) {
      setSearchError(err.response?.data?.error || err.message);
    } finally {
      setSearchLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">User Dashboard</h1>
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "explore"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Search Products
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "cart"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Cart ({cart.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "orders"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "profile"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Profile
          </button>
        </div>

        {globalError && <p className="mb-4 text-red-500">{globalError}</p>}
        {globalMessage && <p className="mb-4 text-green-500">{globalMessage}</p>}

        {/* Explore Tab */}
        {activeTab === "explore" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Businesses Near You</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, category, or tag..."
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {filteredBusinesses.length === 0 ? (
              <p>No businesses found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredBusinesses.map((biz) => (
                  <div
                    key={biz.email}
                    className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                    onClick={() => openBusinessModal(biz)}
                  >
                    <Image
                      src={biz.profileImageUrl || "/placeholder.jpg"}
                      alt={biz.name}
                      loader={() => imageLoader(biz.profileImageUrl)}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{biz.name}</h3>
                      {biz.about && (
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                          {biz.about.length > 50 ? biz.about.slice(0, 50) + "..." : biz.about}
                        </p>
                      )}
                      <button className="mt-4 w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">
                        View Products
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Products Tab */}
        {activeTab === "search" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Search Products by Tags</h2>
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTagInput}
                  onChange={(e) => setSearchTagInput(e.target.value)}
                  placeholder="Enter tag..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = searchTagInput.trim();
                    if (trimmed && !searchTags.includes(trimmed)) {
                      setSearchTags([...searchTags, trimmed]);
                      setSearchTagInput("");
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
                >
                  Add
                </button>
              </div>
              {searchTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchTags.map((tag, index) => (
                    <div key={index} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      <span>{tag}</span>
                      <button type="button" onClick={() => setSearchTags(searchTags.filter((t) => t !== tag))}>
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleProductSearch}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </div>
            {searchError && <p className="text-red-500">{searchError}</p>}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((prod) => (
                  <div key={prod.product_id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
                    <Image
                      src={prod.imageUrl || "/placeholder.jpg"}
                      alt={prod.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover rounded"
                      loader={() => imageLoader(prod.imageUrl)}
                    />
                    <h4 className="mt-2 font-bold text-gray-800 dark:text-white">{prod.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">₦{prod.price}</p>
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="mt-2 w-full bg-green-600 text-white py-1 rounded-md hover:bg-green-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === "cart" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">My Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((product: Product) => (
                  <div key={product.product_id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-4 rounded-md shadow">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={product.imageUrl || "/placeholder.jpg"}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="object-cover rounded-md"
                        loader={() => imageLoader(product.imageUrl)}
                      />
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{product.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300">₦{product.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(product.product_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">My Orders</h2>
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.order_id} className="bg-white dark:bg-gray-700 p-4 rounded-md shadow">
                    <p><strong>Order ID:</strong> {order.order_id}</p>
                    <p><strong>Status:</strong> {order.status.join(", ")}</p>
                    <p><strong>Products:</strong> {order.product_list.join(", ")}</p>
                    <p><strong>Collection Method:</strong> {order.collection_method}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && user && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Update Profile</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Profile Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfileForm({ ...profileForm, profileImage: e.target.files[0] });
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {profileError && <p className="text-red-500">{profileError}</p>}
              {profileMessage && <p className="text-green-500">{profileMessage}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Update Profile
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Business Modal for viewing details and products */}
      {showBusinessModal && selectedBusiness && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg max-w-3xl w-full overflow-y-auto max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedBusiness.name}</h2>
              <button onClick={() => setShowBusinessModal(false)} className="text-red-500 font-bold text-xl">
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
            <div className="mt-6">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Route Map</h4>
              <MapSection
                mapCenter={mapCenter!}
                userPos={userPos!}
                businessPos={businessPos!}
                selectedBusinessName={selectedBusiness.name}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Products</h3>
            {businessProducts.length === 0 ? (
              <p>No products found for this business.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessProducts.map((prod) => (
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
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="mt-2 w-full bg-green-600 text-white py-1 rounded-md hover:bg-green-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-primary-50 dark:bg-gray-800 mt-8">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">About Us</h3>
              <p className="text-primary-700 dark:text-gray-300">
                Your premier destination for discovering local businesses.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-primary-700 dark:text-gray-300">
                <li className="hover:text-primary-500 transition-colors">Home</li>
                <li className="hover:text-primary-500 transition-colors">Shop</li>
                <li className="hover:text-primary-500 transition-colors">Categories</li>
                <li className="hover:text-primary-500 transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">Contact Us</h3>
              <p className="text-primary-700 dark:text-gray-300">Email: info@local-connect.com</p>
              <p className="text-primary-700 dark:text-gray-300">Phone: (555) 123-4567</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
