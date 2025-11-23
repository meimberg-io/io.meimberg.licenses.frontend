import { apiRequest } from "./client";
import type {
  ProductCategory,
  ProductCategoryCreateRequest,
  ProductCategoryUpdateRequest,
  PageProductCategory,
  UUID,
} from "./types";

export async function listProductCategories(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageProductCategory> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);

  const query = searchParams.toString();
  return apiRequest<PageProductCategory>(`/product-categories${query ? `?${query}` : ""}`);
}

export async function getProductCategory(id: UUID): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/product-categories/${id}`);
}

export async function createProductCategory(data: ProductCategoryCreateRequest): Promise<ProductCategory> {
  return apiRequest<ProductCategory>("/product-categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProductCategory(id: UUID, data: ProductCategoryUpdateRequest): Promise<ProductCategory> {
  return apiRequest<ProductCategory>(`/product-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProductCategory(id: UUID): Promise<void> {
  return apiRequest<void>(`/product-categories/${id}`, {
    method: "DELETE",
  });
}

