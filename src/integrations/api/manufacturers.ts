import { apiRequest } from "./client";
import type {
  Manufacturer,
  ManufacturerCreateRequest,
  ManufacturerUpdateRequest,
  PageManufacturer,
  UUID,
} from "./types";

export async function listManufacturers(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageManufacturer> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);
  
  const query = searchParams.toString();
  return apiRequest<PageManufacturer>(`/manufacturers${query ? `?${query}` : ""}`);
}

export async function getManufacturer(id: UUID): Promise<Manufacturer> {
  return apiRequest<Manufacturer>(`/manufacturers/${id}`);
}

export async function createManufacturer(data: ManufacturerCreateRequest): Promise<Manufacturer> {
  return apiRequest<Manufacturer>("/manufacturers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateManufacturer(id: UUID, data: ManufacturerUpdateRequest): Promise<Manufacturer> {
  return apiRequest<Manufacturer>(`/manufacturers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteManufacturer(id: UUID): Promise<void> {
  return apiRequest<void>(`/manufacturers/${id}`, {
    method: "DELETE",
  });
}

