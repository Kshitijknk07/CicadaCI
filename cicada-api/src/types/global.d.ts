declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      username: string;
      role: string;
      exp: number;
      iat: number;
    };
  }
} 