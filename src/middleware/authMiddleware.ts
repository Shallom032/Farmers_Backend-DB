import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
    user?: { user_id: number; role: "farmer" | "buyer" | "admin" | "logistics" };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Malformed token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        if (!decoded.user_id || !decoded.role) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        req.user = {
            user_id: Number(decoded.user_id),
            role: decoded.role as "farmer" | "buyer" | "admin" | "logistics",
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const requireRole = (allowedRoles: ("farmer" | "buyer" | "admin" | "logistics")[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
    };
};
