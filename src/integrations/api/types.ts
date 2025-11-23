export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  displayName: string;
}

export interface UserCreateRequest {
  email: string;
  displayName: string;
}

export interface UserUpdateRequest {
  email?: string;
  displayName?: string;
}

export interface PageUser {
  content: User[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
}

export interface Product {
  id: UUID;
  key: string;
  name: string;
  description?: string;
}

export interface ProductCreateRequest {
  key: string;
  name: string;
  description?: string;
}

export interface ProductUpdateRequest {
  key?: string;
  name?: string;
  description?: string;
}

export interface PageProduct {
  content: Product[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  key: string;
  name: string;
  capacity?: number | null;
  attributes?: Record<string, any> | null;
}

export interface ProductVariantCreateRequest {
  key: string;
  name: string;
  capacity?: number | null;
  attributes?: Record<string, any> | null;
}

export interface ProductVariantUpdateRequest {
  key?: string;
  name?: string;
  capacity?: number | null;
  attributes?: Record<string, any> | null;
}

export interface PageProductVariant {
  content: ProductVariant[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
}

export interface VariantAvailability {
  capacity?: number | null;
  assigned_active_count: number;
  available: boolean;
}

export type AssignmentStatus = "ACTIVE" | "REVOKED";

export interface Assignment {
  id: UUID;
  userId: UUID;
  productVariantId: UUID;
  status: AssignmentStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  note?: string | null;
}

export interface AssignmentCreateRequest {
  userId: UUID;
  productVariantId: UUID;
  startsAt?: string | null;
  note?: string | null;
}

export interface AssignmentUpdateRequest {
  status?: AssignmentStatus;
  endsAt?: string | null;
}

export interface PageAssignment {
  content: Assignment[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}


