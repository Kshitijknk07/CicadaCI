import { AuthToken } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}
