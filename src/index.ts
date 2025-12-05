import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import usersRoutes from "./routes/usersRoutes";
import farmersRoutes from "./routes/farmersRoutes";
import buyersRoutes from "./routes/buyerRoutes";
import logisticsRoutes from "./routes/logisticsRoutes";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { logger } from "./middleware/logger";

// Load env variables
dotenv.config();

const initializeApp = (): Application => {
    const app = express();

    // Middleware
    app.use(express.json()); // Parse JSON
    app.use(cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }));
    app.use(rateLimiterMiddleware); // Rate limiting
    app.use(logger); // Request logger

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/farmers", farmersRoutes);
    app.use("/api/buyers", buyersRoutes);
    app.use("/api/logistics", logisticsRoutes);

    // Default route
    app.get("/", (_, res) => {
        res.send("Hello, express API is running...");
    });

    return app;
};

const app = initializeApp();
export default app;
