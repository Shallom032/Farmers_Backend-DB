import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes";
import { authControllers } from "./controllers/authControllers";
import usersRoutes from "./routes/usersRoutes";
import farmersRoutes from "./routes/farmersRoutes";
import buyersRoutes from "./routes/buyerRoutes";
import logisticsRoutes from "./routes/logisticsRoutes";
import orderRoutes from "./routes/orderRoutes";
import { orderController } from "./controllers/orderController";
import paymentRoutes from "./routes/paymentRoutes";
import productRoutes from "./routes/productRoutes";
import { productController } from "./controllers/productController";
import uploadRoutes from "./routes/uploadRoutes";
import cartRoutes from "./routes/cartRoutes";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { logger } from "./middleware/logger";
import { authMiddleware, requireRole } from "./middleware/authMiddleware";

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

    // Static file serving for uploads
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    app.use('/images', express.static(path.join(process.cwd(), 'uploads')));

    // Additional routes for frontend compatibility
    app.get("/profile", authMiddleware, authControllers.getProfile);
    app.get("/farmer", authMiddleware, requireRole(['farmer']), orderController.getMyOrders);
    app.get("/my", authMiddleware, productController.getMyProducts);
    app.put("/:id/status", authMiddleware, orderController.updateOrderStatus);

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/farmers", farmersRoutes);
    app.use("/api/buyers", buyersRoutes);
    app.use("/api/logistics", logisticsRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/cart", cartRoutes);

    // Default route
    app.get("/", (_, res) => {
        res.send("Hello, express API is running...");
    });

    return app;
};

const app = initializeApp();
export default app;
