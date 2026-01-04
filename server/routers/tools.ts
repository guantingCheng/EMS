import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllTools, getToolById, createTool, updateTool, deleteTool, getBorrowRecordsByToolId, getReturnRecordsByToolId, getMaintenanceRecordsByToolId } from "../db";
import { TRPCError } from "@trpc/server";

export const toolsRouter = router({
  // 獲取所有工具
  list: protectedProcedure.query(async () => {
    try {
      const toolsList = await getAllTools();
      return toolsList;
    } catch (error) {
      console.error("Failed to fetch tools:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tools" });
    }
  }),

  // 根據ID獲取單個工具詳情
  getById: protectedProcedure
    .input(z.object({ toolId: z.number() }))
    .query(async ({ input }) => {
      try {
        const tool = await getToolById(input.toolId);
        if (!tool) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
        }

        // 獲取相關的借用、歸還和維護記錄
        const borrowHistory = await getBorrowRecordsByToolId(input.toolId);
        const returnHistory = await getReturnRecordsByToolId(input.toolId);
        const maintenanceHistory = await getMaintenanceRecordsByToolId(input.toolId);

        return {
          ...tool,
          borrowHistory,
          returnHistory,
          maintenanceHistory,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch tool:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tool" });
      }
    }),

  // 搜尋工具
  search: protectedProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["available", "all"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const allTools = await getAllTools();

        return allTools.filter((tool) => {
          // 按名稱搜尋
          if (input.keyword && !tool.name.toLowerCase().includes(input.keyword.toLowerCase())) {
            return false;
          }

          // 按類別篩選
          if (input.category && tool.category !== input.category) {
            return false;
          }

          // 按狀態篩選
          if (input.status === "available" && tool.availableQuantity === 0) {
            return false;
          }

          return true;
        });
      } catch (error) {
        console.error("Failed to search tools:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to search tools" });
      }
    }),

  // 建立新工具
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        specification: z.string().optional(),
        totalQuantity: z.number().min(1),
        photoUrl: z.string().optional(),
        maintenanceCycleDays: z.number().optional(),
        maintenanceThreshold: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 僅允許管理員建立工具
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create tools" });
      }

      try {
        await createTool({
          name: input.name,
          category: input.category,
          specification: input.specification,
          totalQuantity: input.totalQuantity,
          availableQuantity: input.totalQuantity,
          photoUrl: input.photoUrl,
          maintenanceCycleDays: input.maintenanceCycleDays,
          maintenanceThreshold: input.maintenanceThreshold || 100,
          description: input.description,
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to create tool:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create tool" });
      }
    }),

  // 更新工具資訊
  update: protectedProcedure
    .input(
      z.object({
        toolId: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        specification: z.string().optional(),
        totalQuantity: z.number().optional(),
        photoUrl: z.string().optional(),
        maintenanceCycleDays: z.number().optional(),
        maintenanceThreshold: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update tools" });
      }

      try {
        const tool = await getToolById(input.toolId);
        if (!tool) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
        }

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.category !== undefined) updateData.category = input.category;
        if (input.specification !== undefined) updateData.specification = input.specification;
        if (input.totalQuantity !== undefined) {
          updateData.totalQuantity = input.totalQuantity;
          // 如果總數量增加，也增加可用數量
          const quantityDifference = input.totalQuantity - tool.totalQuantity;
          updateData.availableQuantity = tool.availableQuantity + quantityDifference;
        }
        if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
        if (input.maintenanceCycleDays !== undefined) updateData.maintenanceCycleDays = input.maintenanceCycleDays;
        if (input.maintenanceThreshold !== undefined) updateData.maintenanceThreshold = input.maintenanceThreshold;
        if (input.description !== undefined) updateData.description = input.description;

        await updateTool(input.toolId, updateData);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update tool:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update tool" });
      }
    }),

  // 刪除工具
  delete: protectedProcedure
    .input(z.object({ toolId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete tools" });
      }

      try {
        const tool = await getToolById(input.toolId);
        if (!tool) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
        }

        await deleteTool(input.toolId);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to delete tool:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete tool" });
      }
    }),

  // 獲取工具類別列表
  getCategories: protectedProcedure.query(async () => {
    try {
      const allTools = await getAllTools();
      const categories = Array.from(new Set(allTools.map((tool) => tool.category)));
      return categories;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch categories" });
    }
  }),
});
