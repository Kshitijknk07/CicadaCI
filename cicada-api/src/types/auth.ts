export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  VIEWER = "viewer",
}

export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  name: UserRole;
  permissions: Permission[];
}

export interface AuthToken {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}
