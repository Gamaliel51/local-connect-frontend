"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { backend_url, Business, Product, Order, imageLoader, banks } from "@/utils/data";

const MapSelector = dynamic(() => import("@/components/MapSelector"), { ssr: false });

export default function BusinessDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [businessEmail, setBusinessEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [businessInfo, setBusinessInfo] = useState<Business | null>(null);
  const [infoForm, setInfoForm] = useState({
    name: "",
    about: "",
    address: "",
    phone: "",
    category: "",
    profileImage: null as File | null,
    location: null as [number, number] | null,
  });
  const [infoTagInput, setInfoTagInput] = useState("");
  const [infoTags, setInfoTags] = useState<string[]>([]);
  const [addProductForm, setAddProductForm] = useState({
    name: "",
    about: "",
    price: "",
    productImage: null as File | null,
  });
  const [addProductTagInput, setAddProductTagInput] = useState("");
  const [addProductTags, setAddProductTags] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateProductForm, setUpdateProductForm] = useState({
    product_id: "",
    name: "",
    about: "",
    price: "",
    available: true,
    productImage: null as File | null,
  });
  const [updateProductTagInput, setUpdateProductTagInput] = useState("");
  const [updateProductTags, setUpdateProductTags] = useState<string[]>([]);
  const [wallet, setWallet] = useState<{ amount: number; transactions: any[] } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  // Order update modal state (for editing status only)
  const [isOrderUpdateModalOpen, setIsOrderUpdateModalOpen] = useState(false);
  const [orderUpdateForm, setOrderUpdateForm] = useState({
    order_id: "",
    status: [] as string[],
  });
  const [newOrderStatus, setNewOrderStatus] = useState("");

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    const email = sessionStorage.getItem("email");
    if (!t || !email) {
      router.push("/loginbusiness");
      return;
    }
    setToken(t);
    setBusinessEmail(email);

    axios.get(`${backend_url}/business/${email}`, {
      headers: { Authorization: `Bearer ${t}` },
    }).then((res) => {
      const biz: Business = res.data.business;
      setBusinessInfo(biz);
      setInfoForm({
        name: biz.name || "",
        about: biz.about || "",
        address: biz.address || "",
        phone: biz.phone || "",
        category: biz.category || "",
        profileImage: null,
        location: biz.location || null,
      });
      if (Array.isArray(biz.tags)) setInfoTags(biz.tags);
    }).catch((err) => setError(err.response?.data?.error || err.message));

    axios.get(`${backend_url}/product/by-business/${email}`)
      .then((res) => setProducts(res.data.products))
      .catch((err) => console.error(err));

    axios.get(`${backend_url}/business/wallet/${email}`, {
      headers: { Authorization: `Bearer ${t}` },
    }).then((res) => setWallet(res.data.wallet))
      .catch((err) => console.error("Error fetching wallet:", err));

    // Fetch orders for the business
    axios.get(`${backend_url}/order/fetch-orders`, {
      headers: { Authorization: `Bearer ${t}` },
    }).then((res) => setOrders(res.data.orders))
      .catch((err) => console.error("Error fetching orders:", err));
  }, [router]);

  const mapCenter: [number, number] = infoForm.location
    ? [infoForm.location[1], infoForm.location[0]]
    : [0, 0];

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", infoForm.name);
    formData.append("about", infoForm.about);
    formData.append("address", infoForm.address);
    formData.append("phone", infoForm.phone);
    formData.append("category", infoForm.category);
    formData.append("tags", JSON.stringify(infoTags));
    formData.append("location", JSON.stringify(infoForm.location));
    if (infoForm.profileImage) formData.append("profileImage", infoForm.profileImage);
    
    try {
      const res = await axios.put(`${backend_url}/business/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      setMessage("Business information updated successfully.");
      setBusinessInfo(res.data.business);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleLocationChange = (coords: [number, number]) => {
    setInfoForm(prev => ({ ...prev, location: coords }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", addProductForm.name);
    formData.append("about", addProductForm.about);
    formData.append("price", addProductForm.price);
    formData.append("tags", JSON.stringify(addProductTags));
    if (addProductForm.productImage) formData.append("image", addProductForm.productImage);
    
    try {
      await axios.post(`${backend_url}/product/add-product`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      setMessage("Product added successfully.");
      const prodRes = await axios.get(`${backend_url}/product/by-business/${businessEmail}`);
      setProducts(prodRes.data.products);
      setAddProductForm({ name: "", about: "", price: "", productImage: null });
      setAddProductTagInput("");
      setAddProductTags([]);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const openUpdateModal = (product: Product) => {
    setUpdateProductForm({
      product_id: product.product_id,
      name: product.name,
      about: product.about || "",
      price: product.price.toString(),
      available: product.available !== undefined ? product.available : true,
      productImage: null,
    });
    setUpdateProductTags(Array.isArray(product.tags) ? product.tags : []);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", updateProductForm.name);
    formData.append("about", updateProductForm.about);
    formData.append("price", updateProductForm.price);
    formData.append("available", JSON.stringify(updateProductForm.available));
    formData.append("tags", JSON.stringify(updateProductTags));
    if (updateProductForm.productImage) formData.append("image", updateProductForm.productImage);
    
    try {
      await axios.post(`${backend_url}/product/update/${updateProductForm.product_id}`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      setMessage("Product updated successfully.");
      const prodRes = await axios.get(`${backend_url}/product/by-business/${businessEmail}`);
      setProducts(prodRes.data.products);
      setIsUpdateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setError("");
    setMessage("");
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${backend_url}/product/delete/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Product deleted successfully.");
      const prodRes = await axios.get(`${backend_url}/product/by-business/${businessEmail}`);
      setProducts(prodRes.data.products);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessEmail || !token) return;
    setWithdrawError("");
    setWithdrawMessage("");
    try {
      await axios.post(`${backend_url}/business/wallet/withdraw`, {
        business_email: businessEmail,
        amount: Number(withdrawAmount),
        account_number: accountNumber,
        bank_code: bankCode,
      }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      setWithdrawMessage("Withdrawal initiated successfully.");
      const walletRes = await axios.get(`${backend_url}/business/wallet/${businessEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(walletRes.data.wallet);
      setWithdrawAmount("");
      setAccountNumber("");
      setBankCode("");
    } catch (err: any) {
      setWithdrawError(err.response?.data?.error || err.message);
    }
  };

  // Order management functions: Only update status by adding a new status.
  const openOrderUpdateModal = (order: Order) => {
    setOrderUpdateForm({
      order_id: order.order_id,
      status: order.status || [],
    });
    setNewOrderStatus("");
    setIsOrderUpdateModalOpen(true);
  };

  const handleOrderUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderStatus.trim()) {
      setError("Please enter a new status.");
      return;
    }
    const updatedStatus = [...orderUpdateForm.status, newOrderStatus.trim()];
    try {
      await axios.put(`${backend_url}/order/update-details/${orderUpdateForm.order_id}`, { status: updatedStatus }, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setMessage("Order updated successfully.");
      // Refresh orders list
      const ordersRes = await axios.get(`${backend_url}/order/fetch-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(ordersRes.data.orders);
      setIsOrderUpdateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#eff6ff] text-gray-800 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">Business Dashboard</h1>

        <div className="flex space-x-4 mb-8">
          {["info", "add", "manage", "orders", "wallet"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md capitalize ${
                activeTab === tab 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-800 shadow-md hover:shadow-lg"
              }`}
            >
              {tab === "info"
                ? "Business Info"
                : tab === "add"
                ? "Add Product"
                : tab === "manage"
                ? "Manage Products"
                : tab === "orders"
                ? "Manage Orders"
                : "Wallet"}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-red-500">{error}</p>}
        {message && <p className="mb-4 text-green-500">{message}</p>}

        {activeTab === "info" && businessInfo && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Update Business Info</h2>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Name</label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">About</label>
                <textarea
                  value={infoForm.about}
                  onChange={(e) => setInfoForm({ ...infoForm, about: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Address</label>
                <input
                  type="text"
                  value={infoForm.address}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  type="text"
                  value={infoForm.phone}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Category</label>
                <select
                  value={infoForm.category}
                  onChange={(e) => setInfoForm({ ...infoForm, category: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Restaurants">Restaurants</option>
                  <option value="Retail">Retail</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={infoTagInput}
                    onChange={(e) => setInfoTagInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = infoTagInput.trim();
                      if (trimmed && !infoTags.includes(trimmed)) {
                        setInfoTags([...infoTags, trimmed]);
                        setInfoTagInput("");
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {infoTags.map((tag, index) => (
                    <div key={index} className="bg-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => setInfoTags(infoTags.filter(t => t !== tag))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Business Location</label>
                <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-300">
                  <MapSelector
                    mapCenter={mapCenter}
                    location={infoForm.location}
                    setLocation={handleLocationChange}
                  />
                </div>
                {infoForm.location && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: Longitude {infoForm.location[0].toFixed(4)}, 
                    Latitude {infoForm.location[1].toFixed(4)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setInfoForm({ ...infoForm, profileImage: e.target.files[0] });
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                {businessInfo.profileImageUrl && (
                  <div className="mt-4">
                    <Image
                      loader={() => imageLoader(businessInfo.profileImageUrl)}
                      src={businessInfo.profileImageUrl}
                      alt={businessInfo.name}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Update Business
              </button>
            </form>
          </div>
        )}

        {activeTab === "add" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Product Name</label>
                <input
                  type="text"
                  value={addProductForm.name}
                  onChange={(e) => setAddProductForm({ ...addProductForm, name: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Description</label>
                <textarea
                  value={addProductForm.about}
                  onChange={(e) => setAddProductForm({ ...addProductForm, about: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 h-32"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={addProductForm.price}
                  onChange={(e) => setAddProductForm({ ...addProductForm, price: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addProductTagInput}
                    onChange={(e) => setAddProductTagInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = addProductTagInput.trim();
                      if (trimmed && !addProductTags.includes(trimmed)) {
                        setAddProductTags([...addProductTags, trimmed]);
                        setAddProductTagInput("");
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {addProductTags.map((tag, index) => (
                    <div key={index} className="bg-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => setAddProductTags(addProductTags.filter(t => t !== tag))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setAddProductForm({ ...addProductForm, productImage: e.target.files[0] });
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Add Product
              </button>
            </form>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Manage Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative h-48 w-full">
                    <Image
                      loader={() => imageLoader(product.imageUrl)}
                      src={product.imageUrl || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                    <p className="text-blue-600 font-medium">₦{Number(product.price).toLocaleString()}</p>
                    <p className={`text-sm ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                      {product.available ? "Available" : "Out of Stock"}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openUpdateModal(product)}
                        className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.product_id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Manage Orders</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.order_id} className="p-4 border rounded-lg bg-gray-50">
                    <p className="font-semibold">Order ID: {order.order_id}</p>
                    <p className="text-sm text-gray-600">Customer: {order.customer}</p>
                    <p className="text-sm text-gray-600">Collection Method: {order.collection_method}</p>
                    <p className="text-sm text-gray-600">Products: {order.product_list.join(", ")}</p>
                    {order.customer_notes && order.customer_notes.length > 0 && (
                      <p className="text-sm text-gray-600">Notes: {order.customer_notes.join(", ")}</p>
                    )}
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Status History:</p>
                      <ul className="list-disc ml-6">
                        {order.status.map((s, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => openOrderUpdateModal(order)}
                      className="mt-2 bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                    >
                      Add New Status
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No orders found.</p>
            )}
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Wallet Management</h2>
            {wallet ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <p className="text-3xl font-bold text-blue-900">
                    ₦{wallet.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-600 mt-1">Available Balance</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900">Withdraw Funds</h3>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Amount (₦)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Bank</label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Bank</option>
                        {banks.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {withdrawError && <p className="text-red-500">{withdrawError}</p>}
                    {withdrawMessage && <p className="text-green-500">{withdrawMessage}</p>}

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Withdraw Funds
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900">Transaction History</h3>
                  {wallet.transactions?.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      {wallet.transactions.map((tx, idx) => (
                        <div key={idx} className="py-2 border-b border-gray-200 last:border-0">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {new Date(tx.date).toLocaleDateString()}
                            </span>
                            <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₦{Math.abs(tx.amount).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{tx.from}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No transactions found</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Loading wallet information...</p>
            )}
          </div>
        )}

        {/* Update Product Modal */}
        {isUpdateModalOpen && (
          <div className="fixed inset-0 bg-[#eff6ff] bg-opacity-50 flex items-center justify-center px-4 pt-40 overflow-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Update Product</h2>
              <form onSubmit={handleUpdateProductSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Product Name</label>
                  <input
                    type="text"
                    value={updateProductForm.name}
                    onChange={(e) => setUpdateProductForm({ ...updateProductForm, name: e.target.value })}
                    className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Description</label>
                  <textarea
                    value={updateProductForm.about}
                    onChange={(e) => setUpdateProductForm({ ...updateProductForm, about: e.target.value })}
                    className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 h-32"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateProductForm.price}
                    onChange={(e) => setUpdateProductForm({ ...updateProductForm, price: e.target.value })}
                    className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updateProductForm.available}
                    onChange={(e) => setUpdateProductForm({ ...updateProductForm, available: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-600">Available for purchase</label>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={updateProductTagInput}
                      onChange={(e) => setUpdateProductTagInput(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                      placeholder="Add tag..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = updateProductTagInput.trim();
                        if (trimmed && !updateProductTags.includes(trimmed)) {
                          setUpdateProductTags([...updateProductTags, trimmed]);
                          setUpdateProductTagInput("");
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {updateProductTags.map((tag, index) => (
                      <div key={index} className="bg-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <span>{tag}</span>
                        <button 
                          type="button" 
                          onClick={() => setUpdateProductTags(updateProductTags.filter(t => t !== tag))}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Update Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUpdateProductForm({ ...updateProductForm, productImage: e.target.files[0] });
                      }
                    }}
                    className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Update Modal (Editing status only) */}
        {isOrderUpdateModalOpen && (
          <div className="fixed inset-0 bg-[#eff6ff] bg-opacity-50 flex items-center justify-center px-4 pt-40 overflow-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Add New Order Status</h2>
              <div className="mb-4">
                <p className="text-sm font-semibold">Past Statuses:</p>
                {orderUpdateForm.status.length > 0 ? (
                  <ul className="list-disc ml-6">
                    {orderUpdateForm.status.map((s, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No statuses yet.</p>
                )}
              </div>
              <form onSubmit={handleOrderUpdateSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">New Status</label>
                  <input
                    type="text"
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    className="px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    placeholder='e.g., "preparing", "finished"'
                    required
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOrderUpdateModalOpen(false)}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
