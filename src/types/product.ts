export interface ProductType {
  id: string;
  name: string;
  description: string;
  weight: number;
  categoryId: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}
