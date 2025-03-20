"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backend_url, Business, Product, Order, User, imageLoader } from "@/utils/data";
import dynamic from "next/dynamic";
import { closePaymentModal, useFlutterwave } from 'flutterwave-react-v3';

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

  const [allProducts, setAllProducts] = useState<Product[]>([]);

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

  const [loading, setLoading] = useState(true)
  const [currentNote, setCurrentNote] = useState('')
  const [orderNotes, setOrderNotes] = useState<string[]>([])
  const [orderID, setOrderID] = useState('')

  // On mount: check sessionStorage and load user info, cart, orders, and user location.
  useEffect(() => {
    setLoading(true)
    setOrderID(crypto.randomUUID())
    const t = sessionStorage.getItem("token");
    const email = sessionStorage.getItem("email");
    console.log("EMAIL: ", email)
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

    // Fetch cart from backend Cart model
    axios
      .get(`${backend_url}/cart/${email}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        console.log(res)
        setCartState(res.data.cart.products);
      })
      .catch((err) => console.error("Error fetching cart:", err));

    // Fetch all products for mapping in orders
    axios
      .get(`${backend_url}/product/all`)
      .then((res) => setAllProducts(res.data.products))
      .catch((err) => console.error("Error fetching all products:", err));

    

    // Fetch orders
    axios
      .get(`${backend_url}/order/user/${email}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        console.log("ORD: ", res.data.orders)
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
              setLoading(false)
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

    axios
    .get(`${backend_url}/product/all`)
    .then((res) => setAllProducts(res.data.products))
    .catch((err) => console.error("Error fetching all products:", err));
  }, [router]);

  const config = {
    public_key: "FLWPUBK_TEST-e8cb656356783884c9d35ab16a58dbbd-X",
    tx_ref: orderID,
    amount: Number(calculateTotalPrice(cart)),
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: userEmail!,
      phone_number: '',
      name: orderID,
    },
    customizations: {
      title: "Order",
      description: "Order",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  // Get total of everything in cart
  function calculateTotalPrice(cart: Product[]): number {
    return cart.reduce((total, product) => total + product.price, 0);
  }

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
  const handleAddToCart = async (product: Product) => {
    if (!userEmail || !token) return;
    try {
      const res = await axios.post(
        `${backend_url}/cart/add`,
        { user: userEmail, product },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCartState(res.data.cart.products);
      setGlobalMessage("Product added to cart.");
      alert('Product added to cart')
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
      alert(err.response?.data?.error || err.message)
    }
  };

  // Handler: Remove product from cart
  const handleRemoveFromCart = async (productId: string) => {
    if (!userEmail || !token) return;
    try {
      const res = await axios.delete(`${backend_url}/cart/remove`, {
        data: { user: userEmail, productId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartState(res.data.cart.products);
      setGlobalMessage("Product removed from cart.");
      alert("Product removed from cart")
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
      alert(err.response?.data?.error || err.message)
    }
  };

  const handleSuccess = () => {
    handleCheckout()
  };

  // Handler: Checkout cart – create orders grouped by business
  const handleCheckout = async () => {
    if (!userEmail || cart.length === 0 || !token) return;
  
    // Build an array of productOrders, where each item has the business_owned and product_id
    const productOrders = cart.map((p: Product) => ({
      business_owned: p.business_owned,
      product_id: p.product_id,
    }));
  
    try {
      // Create orders using the backend route.
      await axios.post(
        `${backend_url}/order/create`,
        {
          order_id: orderID,
          customer: userEmail,
          productOrders,
          collection_method: "onsite",
          customer_notes: orderNotes,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Clear the cart after orders are placed
      await axios.delete(`${backend_url}/cart/clear/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartState([]);
      setGlobalMessage("Order placed successfully.");
  
      // Refresh orders
      const ordersRes = await axios.get(`${backend_url}/order/user/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(ordersRes.data.orders);
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
    }
    finally{
      window.location.reload()
    }
  };

  // Build a mapping from product_id to product name
  const productMap = allProducts.reduce((acc, product) => {
    acc[product.product_id] = product.name;
    return acc;
  }, {} as { [key: string]: string });
  
  // Group orders by order id and then by business
  const groupedOrders = orders.reduce((acc: any, order: any) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = {};
    }
    if (!acc[order.order_id][order.business_owned]) {
      acc[order.order_id][order.business_owned] = [];
    }
    acc[order.order_id][order.business_owned].push(order);
    return acc;
  }, {});

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
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">&nbsp;</h1>
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-2 rounded-md mb-2 sm:mb-0 ${
              activeTab === "explore"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md mb-2 sm:mb-0 ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Search Products
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2 rounded-md mb-2 sm:mb-0 ${
              activeTab === "cart"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Cart ({cart.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-md mb-2 sm:mb-0 ${
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
              <p>{loading ? 'Loading businesses....': 'No businesses found.'}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">₦{prod.price.toLocaleString()}</p>
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
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">My Cart - ₦{calculateTotalPrice(cart).toLocaleString()}</h2>
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
                        <p className="text-gray-600 dark:text-gray-300">₦{product.price.toLocaleString()}</p>
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
                <div className="w-full flex flex-col sm:flex-row justify-end items-end sm:items-center">
                  <textarea 
                  name="notes" 
                  id="notes"
                  placeholder="Enter notes for the business. If you want a delivery, your address, etc."
                  cols={50}
                  rows={2}
                  value={currentNote} 
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="bg-white py-3 sm:py-2 px-2 text-sm w-[100%] sm:w-auto text-black"
                  />
                  <button
                  onClick={() => {setOrderNotes([...orderNotes, currentNote]); setCurrentNote('')}}
                  className="bg-green-500 text-white px-4 py-4 rounded-lg h-fit ml-4 mt-4 sm:mt-0">
                    Add Note
                  </button>
                </div>
                <button
                  onClick={() => {
                    handleFlutterPayment({
                      callback: (response) => {
                        console.log(response);
                        if (response.status === "successful") {
                          handleSuccess();
                        } else {
                          console.error("Transaction failed:", response);
                        }
                        closePaymentModal(); // this will close the modal programmatically
                      },
                      onClose: () => {},
                    });
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                >
                  Checkout
                </button>
                {orderNotes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {orderNotes.map((tag, index) => (
                      <div key={index} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                        <span>{tag}</span>
                        <button type="button" onClick={() => setOrderNotes(orderNotes.filter((t) => t !== tag))}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Orders Section */}
        {activeTab === "orders" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">My Orders</h2>
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : Object.keys(groupedOrders).length === 0 ? (
              <p>No orders found.</p>
            ) : (
              Object.entries(groupedOrders).reverse().map(([orderId, bizGroups]: [string, any]) => (
                <div key={orderId} className="bg-white dark:bg-gray-700 p-4 rounded-md shadow mb-6">
                  <p className="font-bold">Order ID: {orderId}</p>
                  {Object.entries(bizGroups).map(([bizEmail, orderArray]: [string, any]) => (
                    <div key={bizEmail} className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold">Business: {bizEmail}</p>
                      {orderArray.map((order: any, idx: number) => {
                        // Group products and count duplicates
                        const productCount = order.product_list.reduce((acc: { [key: string]: number }, prodId: string) => {
                          acc[prodId] = (acc[prodId] || 0) + 1;
                          return acc;
                        }, {} as { [key: string]: number });
                        return (
                          <div key={idx} className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <p>
                              <strong>Status:</strong> {order.status.join(", ")}
                            </p>
                            <p>
                              <strong>Products:</strong>{" "}
                              {Object.entries(productCount)
                                .map(([prodId, count]) => `${productMap[prodId] || prodId} (${count})`)
                                .join(", ")}
                            </p>
                            <p>
                              {/* <strong>Collection Method:</strong> {order.collection_method} */}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">₦{prod.price.toLocaleString()}</p>
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
                <Link href={'/'} className="hover:text-primary-500 transition-colors">Home</Link>
                {/* <li className="hover:text-primary-500 transition-colors">Shop</li> */}
                <Link href={'/categories'} className="hover:text-primary-500 transition-colors">Categories</Link>
                {/* <li className="hover:text-primary-500 transition-colors">Contact</li> */}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-4">Contact Us</h3>
              <p className="text-primary-700 dark:text-gray-300">Email: info@local-connect.com</p>
              <p className="text-primary-700 dark:text-gray-300">Phone: +234 813 393 2164</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
