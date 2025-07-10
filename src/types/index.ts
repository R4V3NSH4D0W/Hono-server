export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// File upload related types
export interface UploadedImage {
  id: string;
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  bucket: string;
  createdAt: string;
}

// Extend Hono request type with custom properties
declare module 'hono' {
  interface ContextVariableMap {
    user: { id: string; email: string; role: string };
  }

  interface HonoRequest {
    user: { id: string; email: string; role: string };
    files?: Record<string, { buffer: Buffer; originalFilename: string }[]>;
    fields?: Record<string, string>;
  }
}
