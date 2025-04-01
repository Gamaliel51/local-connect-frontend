"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backend_url, Business, Product, Order, User, imageLoader } from "@/utils/data";
import dynamic from "next/dynamic";
import { closePaymentModal, useFlutterwave } from 'flutterwave-react-v3';

const MapSection = dynamic(() => import("@/components/MapSection"), { ssr: false });

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
  const [activeTab, setActiveTab] = useState("explore");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [exploreSearch, setExploreSearch] = useState("");
  const [searchTagInput, setSearchTagInput] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessProducts, setBusinessProducts] = useState<Product[]>([]);
  const [cart, setCartState] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [profileForm, setProfileForm] = useState({ 
    name: "", 
    address: "", 
    profileImage: null as File | null 
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState('');
  const [orderNotes, setOrderNotes] = useState<string[]>([]);
  const [orderID, setOrderID] = useState('');

  useEffect(() => {
    setLoading(true);
    setOrderID(crypto.randomUUID());
    const t = sessionStorage.getItem("token");
    const email = sessionStorage.getItem("email");
    
    if (!t || !email) {
      router.push("/login");
      return;
    }

    setToken(t);
    setUserEmail(email);

    axios.get(`${backend_url}/user/profile`, { 
      headers: { Authorization: `Bearer ${t}` } 
    }).then(res => {
      setUser(res.data.user);
      setProfileForm({ 
        name: res.data.user.name || "", 
        address: res.data.user.address || "", 
        profileImage: null 
      });
    }).catch(err => {
      setGlobalError(err.response?.data?.error || err.message);
    });

    axios.get(`${backend_url}/cart/${email}`, { 
      headers: { Authorization: `Bearer ${t}` } 
    }).then(res => {
      setCartState(res.data.cart.products);
    }).catch(err => console.error("Error fetching cart:", err));

    axios.get(`${backend_url}/product/all`)
      .then(res => setAllProducts(res.data.products))
      .catch(err => console.error("Error fetching products:", err));

    axios.get(`${backend_url}/order/user/${email}`, { 
      headers: { Authorization: `Bearer ${t}` } 
    }).then(res => {
      setOrders(res.data.orders);
      setOrdersLoading(false);
    }).catch(err => {
      setGlobalError(err.response?.data?.error || err.message);
      setOrdersLoading(false);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
          axios.post(`${backend_url}/business/fetch-nearby`, 
            { location: coords },
            { headers: { "Content-Type": "application/json" } }
          ).then(res => {
            setBusinesses(res.data.businesses);
            setLoading(false);
          }).catch(err => {
            setGlobalError(err.response?.data?.error || err.message);
          });
        },
        () => setGlobalError("Geolocation permission denied")
      );
    }
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
      name: orderID
    },
    customizations: {
      title: "Order",
      description: "Order",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  function calculateTotalPrice(cart: Product[]): number {
    return cart.reduce((total, product) => total + product.price, 0);
  }

  const filteredBusinesses = businesses.filter(biz => {
    const term = exploreSearch.toLowerCase();
    return (
      biz.name.toLowerCase().includes(term) ||
      (biz.category?.toLowerCase().includes(term)) ||
      (Array.isArray(biz.tags) && biz.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  const openBusinessModal = (biz: Business) => {
    setSelectedBusiness(biz);
    axios.get(`${backend_url}/product/by-business/${biz.email}`)
      .then(res => {
        setBusinessProducts(res.data.products);
        setShowBusinessModal(true);
      })
      .catch(err => console.error(err));
  };

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
        headers: { 
          "Content-Type": "multipart/form-data", 
          Authorization: `Bearer ${token}` 
        }
      });
      setUser(res.data.user);
      setProfileMessage("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.response?.data?.error || err.message);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!userEmail || !token) return;
    try {
      const res = await axios.post(
        `${backend_url}/cart/add`,
        { user: userEmail, product },
        { headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        }}
      );
      setCartState(res.data.cart.products);
      setGlobalMessage("Product added to cart.");
      alert('Product added to cart');
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    if (!userEmail || !token) return;
    try {
      const res = await axios.delete(`${backend_url}/cart/remove`, {
        data: { user: userEmail, productId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartState(res.data.cart.products);
      setGlobalMessage("Product removed from cart.");
      alert("Product removed from cart");
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCheckout = async () => {
    if (!userEmail || cart.length === 0 || !token) return;
    const productOrders = cart.map((p: Product) => ({
      business_owned: p.business_owned,
      product_id: p.product_id
    }));
    try {
      await axios.post(
        `${backend_url}/order/create`,
        {
          order_id: orderID,
          customer: userEmail,
          productOrders,
          collection_method: "onsite",
          customer_notes: orderNotes
        },
        { headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        }}
      );
      await axios.delete(`${backend_url}/cart/clear/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartState([]);
      setGlobalMessage("Order placed successfully.");
      const ordersRes = await axios.get(`${backend_url}/order/user/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(ordersRes.data.orders);
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || err.message);
    } finally {
      window.location.reload();
    }
  };

  const productMap = allProducts.reduce((acc, product) => {
    acc[product.product_id] = product.name;
    return acc;
  }, {} as { [key: string]: string });

  const groupedOrders = orders.reduce((acc: any, order: any) => {
    if (!acc[order.order_id]) acc[order.order_id] = {};
    if (!acc[order.order_id][order.business_owned]) {
      acc[order.order_id][order.business_owned] = [];
    }
    acc[order.order_id][order.business_owned].push(order);
    return acc;
  }, {});

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

  let mapCenter: [number, number] | null = null;
  let userPos: [number, number] | null = null;
  let businessPos: [number, number] | null = null;
  if (userLocation && selectedBusiness?.location) {
    const [userLon, userLat] = userLocation;
    const [busLon, busLat] = selectedBusiness.location;
    mapCenter = [(userLat + busLat) / 2, (userLon + busLon) / 2];
    userPos = [userLat, userLon];
    businessPos = [busLat, busLon];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mt-20 mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 mb-8">
          {["explore", "search", "cart", "orders", "profile"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md mb-2 sm:mb-0 transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border border-blue-100 hover:bg-blue-50"
              }`}
            >
              {tab === "cart" ? `Cart (${cart.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {globalError && <p className="mb-4 text-red-500">{globalError}</p>}
        {globalMessage && <p className="mb-4 text-green-500">{globalMessage}</p>}

        {/* Explore Tab */}
        {activeTab === "explore" && (
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">Businesses Near You</h2>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name, category, or tag..."
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-md border text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {filteredBusinesses.length === 0 ? (
              <p className="text-center">{loading ? 'Loading businesses...' : 'No businesses found.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredBusinesses.map(biz => (
                  <div
                    key={biz.email}
                    onClick={() => openBusinessModal(biz)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
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
                      <h3 className="text-xl font-semibold text-blue-900">{biz.name}</h3>
                      {biz.about && (
                        <p className="mt-2 text-gray-600">
                          {biz.about.slice(0, 50) + (biz.about.length > 50 ? "..." : "")}
                        </p>
                      )}
                      <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
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
            <h2 className="text-4xl font-bold text-blue-900 mb-6">Search Products by Tags</h2>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTagInput}
                  onChange={(e) => setSearchTagInput(e.target.value)}
                  placeholder="Enter tag..."
                  className="w-full px-4 py-3 rounded-md text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
              {searchTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchTags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => setSearchTags(searchTags.filter(t => t !== tag))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleProductSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors"
              >
                {searchLoading ? "Searching..." : "Search Products"}
              </button>
            </div>
            {searchError && <p className="text-red-500">{searchError}</p>}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(prod => (
                  <div
                    key={prod.product_id}
                    className="bg-white rounded-lg shadow-md p-4"
                  >
                    <Image
                      src={prod.imageUrl || "/placeholder.jpg"}
                      alt={prod.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover rounded"
                      loader={() => imageLoader(prod.imageUrl)}
                    />
                    <div className="mt-4">
                      <h4 className="font-bold text-gray-800">{prod.name}</h4>
                      <p className="text-gray-600">₦{prod.price.toLocaleString()}</p>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === "cart" && (
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">
              My Cart - ₦{calculateTotalPrice(cart).toLocaleString()}
            </h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="space-y-6">
                {cart.map((product: Product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between bg-white p-4 rounded-md shadow"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={product.imageUrl || "/placeholder.jpg"}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="object-cover rounded-md"
                        loader={() => imageLoader(product.imageUrl)}
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">{product.name}</h3>
                        <p className="text-gray-600">₦{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(product.product_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="w-full flex flex-col sm:flex-row justify-end items-end gap-4">
                  <textarea
                    name="notes"
                    id="notes"
                    placeholder="Enter notes for the business - Addresses, etc."
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    className="w-full sm:w-96 px-4 py-2 rounded-md text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      setOrderNotes([...orderNotes, currentNote]);
                      setCurrentNote('');
                    }}
                    className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
                <button
                  onClick={() => {
                    handleFlutterPayment({
                      callback: (response) => {
                        if (response.status === "successful") {
                          handleCheckout();
                        }
                        closePaymentModal();
                      },
                      onClose: () => {},
                    });
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md transition-colors"
                >
                  Checkout Now
                </button>
                {orderNotes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {orderNotes.map((tag, index) => (
                      <div key={index} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
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

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">My Orders</h2>
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : Object.keys(groupedOrders).length === 0 ? (
              <p>No orders found.</p>
            ) : (
              Object.entries(groupedOrders).reverse().map(([orderId, bizGroups]: [string, any]) => (
                <div key={orderId} className="bg-white p-6 rounded-md shadow mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Order ID: {orderId}</h3>
                  {Object.entries(bizGroups).map(([bizEmail, orderArray]: [string, any]) => (
                    <div key={bizEmail} className="mb-6 border-b pb-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Business: {bizEmail}</h4>
                      {orderArray.map((order: any, idx: number) => {
                        const productCount = order.product_list.reduce(
                          (acc: { [key: string]: number }, prodId: string) => {
                            acc[prodId] = (acc[prodId] || 0) + 1;
                            return acc;
                          }, {}
                        );
                        return (
                          <div key={idx} className="text-gray-600">
                            <p><strong>Status:</strong> {order.status.join(", ")}</p>
                            <p>
                              <strong>Products:</strong>{" "}
                              {Object.entries(productCount)
                                .map(([prodId, count]) => `${productMap[prodId] || prodId} (${count})`)
                                .join(", ")}
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
          <div className="bg-white p-6 rounded-md shadow-md mb-8">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">Update Profile</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="px-4 py-3 rounded-md text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700">Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="px-4 py-3 rounded-md text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setProfileForm({ ...profileForm, profileImage: e.target.files[0] });
                    }
                  }}
                  className="px-4 py-3 rounded-md text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {profileError && <p className="text-red-500">{profileError}</p>}
              {profileMessage && <p className="text-green-500">{profileMessage}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition-colors"
              >
                Update Profile
              </button>
            </form>
          </div>
        )}

        {/* Business Modal */}
        {showBusinessModal && selectedBusiness && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md shadow-lg max-w-3xl w-full overflow-y-auto max-h-screen">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-900">{selectedBusiness.name}</h2>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="text-red-500 font-bold text-2xl"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600"><strong>About:</strong> {selectedBusiness.about}</p>
                <p className="text-gray-600"><strong>Address:</strong> {selectedBusiness.address}</p>
                <p className="text-gray-600"><strong>Category:</strong> {selectedBusiness.category}</p>
                {selectedBusiness.tags && (
                  <p className="text-gray-600">
                    <strong>Tags:</strong> {Array.isArray(selectedBusiness.tags) ? selectedBusiness.tags.join(", ") : selectedBusiness.tags}
                  </p>
                )}
                <div className="mt-6">
                  <h4 className="text-xl font-bold text-blue-900 mb-4">Route Map</h4>
                  {mapCenter && userPos && businessPos && (
                    <MapSection
                      mapCenter={mapCenter}
                      userPos={userPos}
                      businessPos={businessPos}
                      selectedBusinessName={selectedBusiness.name}
                    />
                  )}
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-4">Products</h3>
                {businessProducts.length === 0 ? (
                  <p>No products found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {businessProducts.map(prod => (
                      <div key={prod.product_id} className="bg-gray-100 p-4 rounded-md shadow">
                        <Image
                          src={prod.imageUrl || "/placeholder.jpg"}
                          alt={prod.name}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover rounded"
                          loader={() => imageLoader(prod.imageUrl)}
                        />
                        <div className="mt-4">
                          <h4 className="font-bold text-gray-800">{prod.name}</h4>
                          <p className="text-gray-600">₦{prod.price.toLocaleString()}</p>
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className="mt-3 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-blue-50 border-t border-gray-300 mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">About Us</h3>
                <p className="text-gray-700">
                  Connecting you with the best local businesses in your community.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Links</h3>
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
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Us</h3>
                <p className="text-gray-700">Email: support@localconnect.com</p>
                <p className="text-gray-700">Phone: +234 800 000 0000</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}