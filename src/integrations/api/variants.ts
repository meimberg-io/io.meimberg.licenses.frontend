import { apiRequest } from "./client";
import type {
  ProductVariant,
  ProductVariantCreateRequest,
  ProductVariantUpdateRequest,
  PageProductVariant,
  VariantAvailability,
  UUID,
} from "./types";

export async function listVariantsByProduct(productId: UUID): Promise<ProductVariant[]> {
  const page = await apiRequest<PageProductVariant>(`/products/${productId}/variants`);
  return page.content || [];
}

export async function createVariant(productId: UUID, data: ProductVariantCreateRequest): Promise<ProductVariant> {
  return apiRequest<ProductVariant>(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getVariant(id: UUID): Promise<ProductVariant> {
  return apiRequest<ProductVariant>(`/variants/${id}`);
}

export async function updateVariant(id: UUID, data: ProductVariantUpdateRequest): Promise<ProductVariant> {
  return apiRequest<ProductVariant>(`/variants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVariant(id: UUID): Promise<void> {
  return apiRequest<void>(`/variants/${id}`, {
    method: "DELETE",
  });
}

export async function getVariantAvailability(id: UUID): Promise<VariantAvailability> {
  return apiRequest<VariantAvailability>(`/variants/${id}/availability`);
}


