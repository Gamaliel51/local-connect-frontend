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
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary-800 dark:text-white mb-8">
          Categories
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category} href={`/categories/${category}`}>
              <div className="cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-lg p-8 flex flex-col items-center justify-center hover:shadow-lg transition duration-200">
                <h2 className="text-2xl font-semibold text-primary-800 dark:text-white">
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
