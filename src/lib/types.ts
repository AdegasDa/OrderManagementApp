export type Client = {
  id: string;
  name: string;
  phone: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  salePrice: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentType = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderPhoto = {
  id: string;
  orderId: string;
  filePath: string;
  createdAt: string;
};

export type OrderProduct = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type Order = {
  id: string;
  orderNumber: number;
  orderDate: string;
  clientId: string;
  paymentTypeId: string;
  statusId: string;
  totalValue: number;
  advanceAmount: number;
  deliveryFee: number;
  pickupHour: string | null;
  notes: string | null;
  deliveryNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderWithRelations = Order & {
  client: Client;
  orderProducts: OrderProduct[];
  paymentType: PaymentType;
  status: OrderStatus;
  photos: OrderPhoto[];
};
