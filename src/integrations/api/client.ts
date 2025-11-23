import type { ProblemDetail } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public problemDetail?: ProblemDetail,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let problemDetail: ProblemDetail | undefined;
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("application/problem+json")) {
      try {
        problemDetail = await response.json();
      } catch {
        // Ignore JSON parse errors
      }
    }
    
    const message = problemDetail?.detail || problemDetail?.title || response.statusText || "API request failed";
    throw new ApiError(message, response.status, problemDetail);
  }
  
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export { ApiError };
export { API_BASE_URL };



