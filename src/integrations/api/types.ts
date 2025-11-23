export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  departmentId: UUID;
}

export interface UserCreateRequest {
  email: string;
  displayName: string;
  departmentId: UUID;
}

export interface UserUpdateRequest {
  email?: string;
  displayName?: string;
  departmentId?: UUID;
}

export interface PageUser {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Product {
  id: UUID;
  key: string;
  name: string;
  description?: string;
  manufacturerId?: UUID | null;
  categoryId?: UUID | null;
}

export interface ProductCreateRequest {
  key: string;
  name: string;
  description?: string;
  manufacturerId?: UUID | null;
  categoryId?: UUID | null;
}

export interface ProductUpdateRequest {
  key?: string;
  name?: string;
  description?: string;
  manufacturerId?: UUID | null;
  categoryId?: UUID | null;
}

export interface PageProduct {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ProductVariant {
  id: UUID;
  productId: UUID;
  key: string;
  name: string;
  description?: string | null;
  price?: number | null;
}

export interface ProductVariantCreateRequest {
  key: string;
  name: string;
  description?: string | null;
  price?: number | null;
}

export interface ProductVariantUpdateRequest {
  key?: string;
  name?: string;
  description?: string | null;
  price?: number | null;
}

export interface PageProductVariant {
  content: ProductVariant[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface VariantAvailability {
  capacity?: number | null;
  assigned_active_count: number;
  available: boolean;
}

export interface Assignment {
  id: UUID;
  userId: UUID;
  productVariantId: UUID;
  note?: string | null;
}

export interface AssignmentCreateRequest {
  userId: UUID;
  productVariantId: UUID;
  note?: string | null;
}

export interface AssignmentUpdateRequest {
}

export interface PageAssignment {
  content: Assignment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Manufacturer {
  id: UUID;
  name: string;
  url?: string | null;
  description?: string | null;
}

export interface ManufacturerCreateRequest {
  name: string;
  url?: string | null;
  description?: string | null;
}

export interface ManufacturerUpdateRequest {
  name?: string;
  url?: string | null;
  description?: string | null;
}

export interface PageManufacturer {
  content: Manufacturer[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Department {
  id: UUID;
  name: string;
}

export interface DepartmentCreateRequest {
  name: string;
}

export interface DepartmentUpdateRequest {
  name?: string;
}

export interface PageDepartment {
  content: Department[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ProductCategory {
  id: UUID;
  name: string;
}

export interface ProductCategoryCreateRequest {
  name: string;
}

export interface ProductCategoryUpdateRequest {
  name?: string;
}

export interface PageProductCategory {
  content: ProductCategory[];
  totalElements: number;
  totalPages: number;
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


