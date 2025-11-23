import { apiRequest } from "./client";
import type {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  PageDepartment,
  UUID,
} from "./types";

export async function listDepartments(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageDepartment> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);
  
  const query = searchParams.toString();
  return apiRequest<PageDepartment>(`/departments${query ? `?${query}` : ""}`);
}

export async function getDepartment(id: UUID): Promise<Department> {
  return apiRequest<Department>(`/departments/${id}`);
}

export async function createDepartment(data: DepartmentCreateRequest): Promise<Department> {
  return apiRequest<Department>("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(
  id: UUID,
  data: DepartmentUpdateRequest
): Promise<Department> {
  return apiRequest<Department>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: UUID): Promise<void> {
  return apiRequest<void>(`/departments/${id}`, {
    method: "DELETE",
  });
}

