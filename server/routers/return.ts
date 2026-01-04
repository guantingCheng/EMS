import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createReturnRecord, getToolById, updateTool, getBorrowRecordById, getReturnRecordsByToolId } from "../db";
import { TRPCError } from "@trpc/server";

export const returnRouter = router({
  // 建立歸還記錄
  create: protectedProcedure
    .input(
      z.object({
        borrowRecordId: z.number(),
        quantity: z.number().min(1),
        condition: z.enum(["good", "minor_damage", "major_damage"]),
        conditionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const borrowRecord = await getBorrowRecordById(input.borrowRecordId);
        if (!borrowRecord) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Borrow record not found" });
        }

        if (input.quantity > borrowRecord.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot return more than borrowed quantity: ${borrowRecord.quantity}`,
          });
        }

        const tool = await getToolById(borrowRecord.toolId);
        if (!tool) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
        }

        // 建立歸還記錄
        await createReturnRecord({
          borrowRecordId: input.borrowRecordId,
          toolId: borrowRecord.toolId,
          returnerId: ctx.user.id,
          returnerName: ctx.user.name || "Unknown",
          quantity: input.quantity,
          returnTime: new Date(),
          condition: input.condition,
          conditionNotes: input.conditionNotes,
        });

        // 更新工具的可用數量
        await updateTool(borrowRecord.toolId, {
          availableQuantity: tool.availableQuantity + input.quantity,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create return record:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create return record" });
      }
    }),

  // 獲取特定工具的歸還記錄
  getByToolId: protectedProcedure
    .input(z.object({ toolId: z.number() }))
    .query(async ({ input }) => {
      try {
        const records = await getReturnRecordsByToolId(input.toolId);
        return records;
      } catch (error) {
        console.error("Failed to fetch return records:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch return records" });
      }
    }),
});
