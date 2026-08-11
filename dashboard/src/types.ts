export interface Tenant {
  id: string;
  slug: string;
  domain?: { name?: string; status?: string } | string;
  plan: string;
  tenantId: string;
  url: string;
}

export interface Owner {
  id: string;
  email: string;
  tenantId: string;
  url?: string;
}

export interface AuthResponse {
  message: string;
  tenant: Tenant;
  owner: Owner;
  type: string;
  token: string;
}

export interface BuyingOption {
  name?: string;
  description?: string;
  sizes?: string[];
  price?: number;
  colors?: string[];
  image?: string[];
}

export interface Product {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  size?: string[];
  price: number;
  colors?: string[];
  images: string[];
  category: string;
  subcategory?: string;
  buyingOptions?: BuyingOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId?: string;
  name?: string;
  quantity: number;
  price?: number;
}

export interface Order {
  _id: string;
  orderId: string;
  tenantId: string;
  customer: { name?: string; email?: string; phone?: string };
  shippingAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface Customer {
  _id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  roles: string[];
  isVerified: boolean;
  createdAt: string;
}
