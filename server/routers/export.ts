import { protectedProcedure, router } from "../_core/trpc";
import { getActiveBorrowRecords, getDb } from "../db";
import { borrowRecords } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, gte, lte, and } from "drizzle-orm";

export const exportRouter = router({
  // 匯出借用記錄
  borrowRecords: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        projectName: z.string().optional(),
        status: z.enum(["borrowed", "returned", "all"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // 應用日期篩選
        const conditions = [];

        if (input.startDate) {
          conditions.push(gte(borrowRecords.borrowTime, input.startDate));
        }

        if (input.endDate) {
          const endOfDay = new Date(input.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          conditions.push(lte(borrowRecords.borrowTime, endOfDay));
        }

        if (input.projectName) {
          conditions.push(eq(borrowRecords.projectName, input.projectName));
        }

        if (input.status && input.status !== "all") {
          conditions.push(eq(borrowRecords.status, input.status));
        }

        let query = db.select().from(borrowRecords);

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        const records = await query;

        // 格式化數據用於Excel
        const formattedRecords = records.map((record) => ({
          借用人: record.borrowerName,
          案場名稱: record.projectName || "-",
          工具ID: record.toolId,
          數量: record.quantity,
          借用時間: new Date(record.borrowTime).toLocaleString("zh-TW"),
          預計歸還: record.expectedReturnTime
            ? new Date(record.expectedReturnTime).toLocaleString("zh-TW")
            : "-",
          狀態: record.status === "borrowed" ? "借用中" : "已歸還",
          備註: record.notes || "-",
        }));

        return formattedRecords;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to export borrow records:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export records",
        });
      }
    }),
});
