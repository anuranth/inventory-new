import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;

    const whereClause = {};

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: fromDate,
        lte: toDate
      };
    }

    // Fetch sales with product details
    const salesData = await prisma.sales.findMany({
      where: whereClause,
      orderBy: { sale_id: "desc" },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    // Add total_price even if DB does not have it
    const report = salesData.map((item) => ({
      ...item,
      total_price: (item.quantity ?? 0) * (item.price ?? 0)
    }));

    res.json(report);

  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export default router;

