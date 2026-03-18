import "dotenv/config";
import express from "express";
import cors from "cors";

// Import Routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import stockRoutes from "./routes/stock.js";
import categoryRoutes from "./routes/categories.js";
import reportRoutes from "./routes/Report.js";

const app = express();
const port = Number(process.env.PORT) || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.send("✅ Smart Inventory API is running!");
});

// Mount Routes
// Auth routes handle /api/login, /api/signup, /api/verify
app.use("/api", authRoutes); 
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/report", reportRoutes);

// Start Server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
