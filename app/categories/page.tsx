"use client";
import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Restaurants",
    link: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: "Retail",
    link: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmV0YWlsJTIwc3RvcmV8ZW58MHx8MHx8fDA%3D',
  },
  {
    name: "Fashion",
    link: 'https://img.freepik.com/free-photo/shop-clothing-clothes-shop-hanger-modern-shop-boutique_1150-8886.jpg?semt=ais_hybrid&w=740',
  },
  {
    name: "Services",
    link: 'https://media.istockphoto.com/id/1387250100/photo/a-happy-customer-paying-at-checkout-with-credit-card-in-supermarket.jpg?s=612x612&w=0&k=20&c=HvOOgZLEtpv9StMXoJteDdWZW1cjH0NJi6K61_DoZxk=',
  },
  {
    name: "Technology",
    link: 'https://www.newcastlesys.com/hs-fs/hubfs/.2024/Modern%20shopping.jpeg?width=1125&height=755&name=Modern%20shopping.jpeg',
  },
  {
    name: "Health",
    link: 'https://franchiseindia.s3.ap-south-1.amazonaws.com/uploads/content/wi/art/59f59aa910d63.jpg',
  },
  {
    name: "Beauty",
    link: 'https://images.yourstory.com/cs/4/211ccaf00e6d11e997fe8f165dce9bb1/Imageifxu-1596799036123-1601633425902.jpg?mode=crop&crop=faces&ar=2%3A1&format=auto&w=1920&q=75',
  },
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
            <Link key={category.name} href={`/categories/${category.name}`} className="text-xl font-semibold text-blue-900 text-center bg-white rounded-2xl shadow-lg py-6 flex flex-col items-center justify-center transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer hover:bg-blue-50">
              <Image
                src={category.link}
                alt="Local Connect connecting users to nearby businesses"
                width={300}
                height={200}
                className="w-8/12 mx-auto rounded-lg shadow-lg mb-4"
                unoptimized
              />
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}