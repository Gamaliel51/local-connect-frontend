"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backend_url, Business, Product, imageLoader } from "@/utils/data";

export default function BusinessDashboard() {
  const router = useRouter();

  // Retrieve token and business email from session storage
  const [token, setToken] = useState<string | null>(null);
  const [businessEmail, setBusinessEmail] = useState<string | null>(null);

  // Tab state: "info", "add", "manage"
  const [activeTab, setActiveTab] = useState("info");

  // Business info state
  const [businessInfo, setBusinessInfo] = useState<Business | null>(null);
  const [infoForm, setInfoForm] = useState({
    name: "",
    about: "",
    address: "",
    category: "",
    profileImage: null as File | null,
  });
  const [infoTagInput, setInfoTagInput] = useState("");
  const [infoTags, setInfoTags] = useState<string[]>([]);

  // Add Product form state
  const [addProductForm, setAddProductForm] = useState({
    name: "",
    about: "",
    price: "",
    productImage: null as File | null,
  });
  const [addProductTagInput, setAddProductTagInput] = useState("");
  const [addProductTags, setAddProductTags] = useState<string[]>([]);

  // Products list state
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State for update product modal
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

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    const email = sessionStorage.getItem("email");
    if (!t || !email) {
      router.push("/loginbusiness");
      return;
    }
    setToken(t);
    setBusinessEmail(email);

    // Fetch business info
    axios
      .get(`${backend_url}/business/${email}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        const biz = res.data.business;
        setBusinessInfo(biz);
        setInfoForm({
          name: biz.name || "",
          about: biz.about || "",
          address: biz.address || "",
          category: biz.category || "",
          profileImage: null,
        });
        if (Array.isArray(biz.tags)) {
          setInfoTags(biz.tags);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
      });

    // Fetch products for this business
    axios
      .get(`${backend_url}/product/by-business/${email}`)
      .then((res) => {
        setProducts(res.data.products);
      })
      .catch((err) => console.error(err));
  }, [router]);

  // Handler to update business info
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", infoForm.name);
    formData.append("about", infoForm.about);
    formData.append("address", infoForm.address);
    formData.append("category", infoForm.category);
    formData.append("tags", JSON.stringify(infoTags));
    if (infoForm.profileImage) {
      formData.append("profileImage", infoForm.profileImage);
    }
    try {
      const res = await axios.put(`${backend_url}/business/update-profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Business information updated successfully.");
      setBusinessInfo(res.data.business);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Handler to add a product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", addProductForm.name);
    formData.append("about", addProductForm.about);
    formData.append("price", addProductForm.price);
    formData.append("tags", JSON.stringify(addProductTags));
    if (addProductForm.productImage) {
      formData.append("image", addProductForm.productImage);
    }
    try {
      await axios.post(`${backend_url}/product/add-product`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
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

  // Open update modal and populate form with product details
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

  // Handler to update product using full form data
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
    if (updateProductForm.productImage) {
      formData.append("image", updateProductForm.productImage);
    }
    try {
      await axios.put(
        `${backend_url}/product/update/${updateProductForm.product_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Product updated successfully.");
      const prodRes = await axios.get(`${backend_url}/product/by-business/${businessEmail}`);
      setProducts(prodRes.data.products);
      setIsUpdateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Handler to delete a product
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

  return (
    <div className="min-h-screen mt-20 bg-gray-100 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">
          Business Dashboard
        </h1>
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "info"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Business Info
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "add"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Add Product
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "manage"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            Manage Products
          </button>
        </div>

        {error && <p className="mb-4 text-red-500">{error}</p>}
        {message && <p className="mb-4 text-green-500">{message}</p>}

        {/* Business Info Update Tab */}
        {activeTab === "info" && businessInfo && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Update Business Info
            </h2>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">About</label>
                <textarea
                  value={infoForm.about}
                  onChange={(e) => setInfoForm({ ...infoForm, about: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Address</label>
                <input
                  type="text"
                  value={infoForm.address}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Category</label>
                <select
                  value={infoForm.category}
                  onChange={(e) => setInfoForm({ ...infoForm, category: e.target.value })}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Restaurants">Restaurants</option>
                  <option value="Retail">Retail</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Services">Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Health">Health</option>
                  <option value="Beauty">Beauty</option>
                </select>
              </div>
              {/* Info Tags Input */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Add Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={infoTagInput}
                    onChange={(e) => setInfoTagInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Add
                  </button>
                </div>
                {infoTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {infoTags.map((tag, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        <span>{tag}</span>
                        <button type="button" onClick={() => setInfoTags(infoTags.filter((t) => t !== tag))}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Profile Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setInfoForm({ ...infoForm, profileImage: e.target.files[0] });
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 mt-4"
              >
                Update Info
              </button>
            </form>
          </div>
        )}

        {/* Add Product Tab */}
        {activeTab === "add" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Add Product
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Product Name</label>
                <input
                  type="text"
                  value={addProductForm.name}
                  onChange={(e) =>
                    setAddProductForm({ ...addProductForm, name: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">About</label>
                <textarea
                  value={addProductForm.about}
                  onChange={(e) =>
                    setAddProductForm({ ...addProductForm, about: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={addProductForm.price}
                  onChange={(e) =>
                    setAddProductForm({ ...addProductForm, price: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              {/* Product Tags Input */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Add Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addProductTagInput}
                    onChange={(e) => setAddProductTagInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Add
                  </button>
                </div>
                {addProductTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {addProductTags.map((tag, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        <span>{tag}</span>
                        <button type="button" onClick={() => setAddProductTags(addProductTags.filter((t) => t !== tag))}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAddProductForm({ ...addProductForm, productImage: e.target.files[0] });
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 mt-4"
              >
                Add Product
              </button>
            </form>
          </div>
        )}

        {/* Manage Products Tab */}
        {activeTab === "manage" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Manage Products
            </h2>
            {products.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.product_id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
                    <Image
                      src={product.imageUrl || "/placeholder.jpg"}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover mb-2"
                      loader={() => imageLoader(product.imageUrl)}
                    />
                    <h3 className="font-bold text-gray-800 dark:text-white">{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">₦{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {product.available ? "Available" : "Not Available"}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => openUpdateModal(product)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.product_id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Product Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Update Product</h2>
            <form onSubmit={handleUpdateProductSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Product Name</label>
                <input
                  type="text"
                  value={updateProductForm.name}
                  onChange={(e) =>
                    setUpdateProductForm({ ...updateProductForm, name: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">About</label>
                <textarea
                  value={updateProductForm.about}
                  onChange={(e) =>
                    setUpdateProductForm({ ...updateProductForm, about: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateProductForm.price}
                  onChange={(e) =>
                    setUpdateProductForm({ ...updateProductForm, price: e.target.value })
                  }
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-200">Available</label>
                <input
                  type="checkbox"
                  checked={updateProductForm.available}
                  onChange={(e) =>
                    setUpdateProductForm({ ...updateProductForm, available: e.target.checked })
                  }
                />
              </div>
              {/* Update Product Tags Input */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Add Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={updateProductTagInput}
                    onChange={(e) => setUpdateProductTagInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Add
                  </button>
                </div>
                {updateProductTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {updateProductTags.map((tag, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setUpdateProductTags(updateProductTags.filter((t) => t !== tag))
                          }
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200">Product Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUpdateProductForm({ ...updateProductForm, productImage: e.target.files[0] });
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
