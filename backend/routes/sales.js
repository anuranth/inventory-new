import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// 🧾 GET all sales
router.get("/", async (req, res) => {
  try {
    const sales = await prisma.sales.findMany({
      orderBy: { sale_id: "desc" },
      include: {
        product: {
          include: { category: true },
        },
      },
    });
    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

router.post("/filter", async (req, res) => {
  try {
    const { from_date, to_date } = req.body;

    if (!from_date || !to_date) {
      return res.status(400).json({ message: "Missing dates" });
    }

    const query = `
      SELECT s.*, p.product_name, p.price
      FROM Sales s
      JOIN Product p ON s.product_id = p.product_id
      WHERE DATE(s.sale_date) BETWEEN ? AND ?
      ORDER BY s.sale_date ASC
    `;

    db.all(query, [from_date, to_date], (err, rows) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json(rows);
    });

  } catch (error) {
    console.error("FILTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🛒 CHECKOUT (Bulk Sale & Stock Update)
router.post("/checkout", async (req, res) => {
  console.log("=== PROCESSING CHECKOUT ===");
  try {
    const { items, invoiceId, date } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // Prepare transaction operations
    const operations = [];

    // 1. Verify stock availability for ALL items before processing any
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { product_id: Number(item.productId) },
        include: { stocks: true },
      });

      if (!product) throw new Error(`Product ID ${item.productId} not found`);

      const currentStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.product_name}. Available: ${currentStock}`);
      }
    }

    // 2. Build Transaction Operations
    for (const item of items) {
      // A. Create Sale Record
      // Note: Ensure your Prisma schema has 'invoiceId' in Sales model, 
      // otherwise remove that field from below.
      operations.push(
        prisma.sales.create({
          data: {
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            date: new Date(date),
            // invoiceId: invoiceId // Uncomment if you added this field to schema
          },
        })
      );

      // B. Deduct Stock
      operations.push(
        prisma.stock.create({
          data: {
            productId: Number(item.productId),
            quantity: -Number(item.quantity), // Negative qty for deduction
            date: new Date(),
          },
        })
      );
    }

    // 3. Execute Transaction
    await prisma.$transaction(operations);

    console.log(`✅ Invoice ${invoiceId} processed successfully.`);
    res.json({ success: true, invoiceId });

  } catch (err) {
    console.error("Checkout Error:", err.message);
    res.status(400).json({ error: err.message || "Checkout Failed" });
  }
});

export default router;