import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createBorrowRecord, getToolById, updateTool, getBorrowRecordsByToolId, getActiveBorrowRecords, getBorrowRecordById } from "../db";
import { TRPCError } from "@trpc/server";

export const borrowRouter = router({
  // 建立多項借用記錄
  createMultiple: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        items: z.array(
          z.object({
            toolId: z.number(),
            quantity: z.number().min(1),
          })
        ),
        expectedReturnDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const borrowIds = [];

        for (const item of input.items) {
          const tool = await getToolById(item.toolId);
          if (!tool) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Tool ${item.toolId} not found` });
          }

          if (tool.availableQuantity < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient quantity for ${tool.name}. Available: ${tool.availableQuantity}`,
            });
          }

          // 建立借用記錄
          const result = await createBorrowRecord({
            toolId: item.toolId,
            borrowerId: ctx.user.id,
            borrowerName: ctx.user.name || "Unknown",
            quantity: item.quantity,
            borrowTime: new Date(),
            expectedReturnTime: input.expectedReturnDate,
            status: "borrowed",
            projectName: input.projectName,
            notes: input.notes,
          });

          borrowIds.push(result);

          // 更新工具的可用數量
          await updateTool(item.toolId, {
            availableQuantity: tool.availableQuantity - item.quantity,
            usageCount: (tool.usageCount || 0) + item.quantity,
          });
        }

        return { success: true, borrowIds };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: String(error) });
      }
    }),

  // 建立借用記錄
  create: protectedProcedure
    .input(
      z.object({
        toolId: z.number(),
        quantity: z.number().min(1),
        expectedReturnTime: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tool = await getToolById(input.toolId);
        if (!tool) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
        }

        if (tool.availableQuantity < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient quantity. Available: ${tool.availableQuantity}`,
          });
        }

        // 建立借用記錄
        await createBorrowRecord({
          toolId: input.toolId,
          borrowerId: ctx.user.id,
          borrowerName: ctx.user.name || "Unknown",
          quantity: input.quantity,
          borrowTime: new Date(),
          expectedReturnTime: input.expectedReturnTime,
          status: "borrowed",
          notes: input.notes,
        });

        // 更新工具的可用數量
        await updateTool(input.toolId, {
          availableQuantity: tool.availableQuantity - input.quantity,
          usageCount: (tool.usageCount || 0) + input.quantity,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create borrow record:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create borrow record" });
      }
    }),

  // 獲取活躍的借用記錄
  getActive: protectedProcedure.query(async () => {
    try {
      const records = await getActiveBorrowRecords();
      return records;
    } catch (error) {
      console.error("Failed to fetch active borrow records:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch borrow records" });
    }
  }),

  // 獲取特定工具的借用記錄
  getByToolId: protectedProcedure
    .input(z.object({ toolId: z.number() }))
    .query(async ({ input }) => {
      try {
        const records = await getBorrowRecordsByToolId(input.toolId);
        return records;
      } catch (error) {
        console.error("Failed to fetch borrow records:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch borrow records" });
      }
    }),

  // 獲取借用記錄詳情
  getById: protectedProcedure
    .input(z.object({ recordId: z.number() }))
    .query(async ({ input }) => {
      try {
        const record = await getBorrowRecordById(input.recordId);
        if (!record) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Borrow record not found" });
        }
        return record;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch borrow record:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch borrow record" });
      }
    }),
});
