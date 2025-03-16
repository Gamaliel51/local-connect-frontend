export const backend_url: string = 'http://localhost:8080'

export const imageLoader = (link: string) => {
    return `${link}`
}


export interface Business {
    email: string;
    name: string;
    about?: string;
    address?: string;
    // Assuming location is an array of two floats: [longitude, latitude]
    location?: [number, number];
    category?: string;
    profileImageUrl: string;
    active?: boolean;
    tags?: string[];
}
  
export interface Order {
    order_id: string,
    business_owned: string; // Business email
    customer: string;       // Customer/User email
    product_list: string[]; // Array of product IDs
    // Only two allowed values: "onsite" or "delivery"
    collection_method: "onsite" | "delivery";
    customer_notes?: string[];
    status: string[];
}
  
export interface Product {
    business_owned: string; // Business email
    name: string;
    product_id: string;
    about?: string;
    price: number;
    imageUrl: string;
    available?: boolean;
    tags?: string[];
}
  
export interface User {
    email: string;
    name: string;
    address?: string;
    profileImageUrl?: string;
}
  
