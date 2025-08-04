import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  User,
  UserRole,
  Permission,
  Role,
  AuthToken,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export class AuthService {
  private users: Map<string, User> = new Map();
  private roles: Map<UserRole, Role> = new Map();

  constructor() {
    this.initializeRoles();
    this.createDefaultAdmin();
  }

  private initializeRoles(): void {
    const adminRole: Role = {
      name: UserRole.ADMIN,
      permissions: [{ resource: "*", action: "*" }],
    };

    const userRole: Role = {
      name: UserRole.USER,
      permissions: [
        { resource: "pipeline", action: "read" },
        { resource: "pipeline", action: "create" },
        { resource: "pipeline", action: "update" },
        { resource: "pipeline", action: "delete" },
        { resource: "run", action: "read" },
        { resource: "run", action: "create" },
        { resource: "run", action: "cancel" },
      ],
    };

    const viewerRole: Role = {
      name: UserRole.VIEWER,
      permissions: [
        { resource: "pipeline", action: "read" },
        { resource: "run", action: "read" },
      ],
    };

    this.roles.set(UserRole.ADMIN, adminRole);
    this.roles.set(UserRole.USER, userRole);
    this.roles.set(UserRole.VIEWER, viewerRole);
  }

  private async createDefaultAdmin(): Promise<void> {
    const adminExists = Array.from(this.users.values()).some(
      (u) => u.role === UserRole.ADMIN
    );
    if (!adminExists) {
      await this.register({
        username: "admin",
        email: "admin@cicadaci.com",
        password: "admin123",
        role: UserRole.ADMIN,
      });
    }
  }

  async register(request: RegisterRequest): Promise<User> {
    const existingUser = Array.from(this.users.values()).find(
      (u) => u.username === request.username || u.email === request.email
    );

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(request.password, 10);
    const user: User = {
      id: this.generateId(),
      username: request.username,
      email: request.email,
      role: request.role || UserRole.USER,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async login(request: LoginRequest): Promise<{ user: User; token: string }> {
    const user = Array.from(this.users.values()).find(
      (u) => u.username === request.username
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // For demo purposes, we'll use a simple password check
    // In production, you'd store hashed passwords
    if (request.password !== "admin123" && request.password !== "user123") {
      throw new Error("Invalid credentials");
    }

    user.lastLogin = new Date();
    const token = this.generateToken(user);

    return { user, token };
  }

  verifyToken(token: string): AuthToken {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  hasPermission(userRole: UserRole, resource: string, action: string): boolean {
    const role = this.roles.get(userRole);
    if (!role) return false;

    return role.permissions.some((permission) => {
      if (permission.resource === "*" && permission.action === "*") {
        return true;
      }
      if (permission.resource === resource && permission.action === "*") {
        return true;
      }
      return permission.resource === resource && permission.action === action;
    });
  }

  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  private generateToken(user: User): string {
    const payload: AuthToken = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
