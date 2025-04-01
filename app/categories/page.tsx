"use client";
import Link from "next/link";

const categories = [
  "Restaurants",
  "Retail",
  "Fashion",
  "Services",
  "Technology",
  "Health",
  "Beauty",
];

export default function CategoryIndex() {
  return (
    <div className="min-h-screen mt-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900">
            All Categories
          </h1>
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link key={category} href={`/categories/${category}`}>
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer hover:bg-blue-50">
                <h2 className="text-xl font-semibold text-blue-900 text-center">
                  {category}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}