import { apiRequest } from "./client";
import type {
  Assignment,
  AssignmentCreateRequest,
  AssignmentUpdateRequest,
  PageAssignment,
  AssignmentStatus,
  UUID,
} from "./types";

export async function listAssignments(params?: {
  userId?: UUID;
  variantId?: UUID;
  status?: AssignmentStatus;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageAssignment> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.append("userId", params.userId);
  if (params?.variantId) searchParams.append("variantId", params.variantId);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.page !== undefined) searchParams.append("page", params.page.toString());
  if (params?.size !== undefined) searchParams.append("size", params.size.toString());
  if (params?.sort) searchParams.append("sort", params.sort);
  
  const query = searchParams.toString();
  return apiRequest<PageAssignment>(`/assignments${query ? `?${query}` : ""}`);
}

export async function getAssignment(id: UUID): Promise<Assignment> {
  return apiRequest<Assignment>(`/assignments/${id}`);
}

export async function createAssignment(data: AssignmentCreateRequest): Promise<Assignment> {
  return apiRequest<Assignment>("/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAssignment(id: UUID, data: AssignmentUpdateRequest): Promise<Assignment> {
  return apiRequest<Assignment>(`/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}


