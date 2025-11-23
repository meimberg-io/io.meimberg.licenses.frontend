import { apiRequest } from "./client";
import type { Product, ProductCreateRequest, ProductUpdateRequest, PageProduct, UUID } from "./types";

export async function listProducts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageProduct> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);
  
  const query = searchParams.toString();
  return apiRequest<PageProduct>(`/products${query ? `?${query}` : ""}`);
}

export async function getProduct(id: UUID): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

export async function createProduct(data: ProductCreateRequest): Promise<Product> {
  return apiRequest<Product>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: UUID, data: ProductUpdateRequest): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: UUID): Promise<void> {
  return apiRequest<void>(`/products/${id}`, {
    method: "DELETE",
  });
}



