import { RateLimiterMemory } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";

const rateLimiter = new RateLimiterMemory({
    points: 10,   // 10 requests
    duration: 60, // per 60 seconds
});

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await rateLimiter.consume(req.ip || "unknown");
        next();
    } catch (err) {
        res.status(429).json({ message: "Too Many Requests, please try again later" });
    }
};
