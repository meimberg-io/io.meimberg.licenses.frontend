import { apiRequest } from "./client";
import type { User, UserCreateRequest, UserUpdateRequest, PageUser, UUID } from "./types";

export async function listUsers(params?: {
  email?: string;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageUser> {
  const searchParams = new URLSearchParams();
  if (params?.email) searchParams.append("email", params.email);
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);
  
  const query = searchParams.toString();
  return apiRequest<PageUser>(`/users${query ? `?${query}` : ""}`);
}

export async function getUser(id: UUID): Promise<User> {
  return apiRequest<User>(`/users/${id}`);
}

export async function createUser(data: UserCreateRequest): Promise<User> {
  return apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: UUID, data: UserUpdateRequest): Promise<User> {
  return apiRequest<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: UUID): Promise<void> {
  return apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  });
}


