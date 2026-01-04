import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllTools, getActiveBorrowRecords, getMaintenanceRecordsByToolId, createMaintenanceNotification, getUnnotifiedMaintenanceNotifications } from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const analyticsRouter = router({
  // 獲取庫存統計
  getInventoryStats: protectedProcedure.query(async () => {
    try {
      const tools = await getAllTools();
      const activeBorrows = await getActiveBorrowRecords();

      const totalTools = tools.length;
      const totalQuantity = tools.reduce((sum, tool) => sum + tool.totalQuantity, 0);
      const availableQuantity = tools.reduce((sum, tool) => sum + tool.availableQuantity, 0);
      const borrowedQuantity = totalQuantity - availableQuantity;
      const activeBorrowCount = activeBorrows.length;

      const toolsNeedingMaintenance = tools.filter(
        (tool) => tool.nextMaintenanceDate && new Date(tool.nextMaintenanceDate) <= new Date()
      );

      return {
        totalTools,
        totalQuantity,
        availableQuantity,
        borrowedQuantity,
        activeBorrowCount,
        toolsNeedingMaintenance: toolsNeedingMaintenance.length,
        utilizationRate: totalQuantity > 0 ? ((borrowedQuantity / totalQuantity) * 100).toFixed(2) : "0",
      };
    } catch (error) {
      console.error("Failed to fetch inventory stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch inventory stats" });
    }
  }),

  // 獲取工具使用率統計
  getToolUsageStats: protectedProcedure.query(async () => {
    try {
      const tools = await getAllTools();

      const stats = tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        category: tool.category,
        totalQuantity: tool.totalQuantity,
        availableQuantity: tool.availableQuantity,
        usageCount: tool.usageCount || 0,
        utilizationRate:
          tool.totalQuantity > 0 ? (((tool.totalQuantity - tool.availableQuantity) / tool.totalQuantity) * 100).toFixed(2) : "0",
      }));

      return stats.sort((a, b) => parseFloat(b.utilizationRate) - parseFloat(a.utilizationRate));
    } catch (error) {
      console.error("Failed to fetch tool usage stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tool usage stats" });
    }
  }),

  // 獲取借用趨勢
  getBorrowTrends: protectedProcedure.query(async () => {
    try {
      const activeBorrows = await getActiveBorrowRecords();

      const trends = activeBorrows.reduce(
        (acc, record) => {
          const date = new Date(record.borrowTime).toLocaleDateString();
          const existing = acc.find((t) => t.date === date);
          if (existing) {
            existing.count += 1;
            existing.quantity += record.quantity;
          } else {
            acc.push({ date, count: 1, quantity: record.quantity });
          }
          return acc;
        },
        [] as Array<{ date: string; count: number; quantity: number }>
      );

      return trends;
    } catch (error) {
      console.error("Failed to fetch borrow trends:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch borrow trends" });
    }
  }),

  // 獲取需要維護的工具
  getToolsNeedingMaintenance: protectedProcedure.query(async () => {
    try {
      const tools = await getAllTools();

      const needsMaintenance = tools.filter((tool) => {
        const needsCycleMaintenance =
          tool.nextMaintenanceDate && new Date(tool.nextMaintenanceDate) <= new Date();
        const needsUsageMaintenance = tool.usageCount && tool.usageCount >= (tool.maintenanceThreshold || 100);
        return needsCycleMaintenance || needsUsageMaintenance;
      });

      return needsMaintenance;
    } catch (error) {
      console.error("Failed to fetch tools needing maintenance:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tools needing maintenance" });
    }
  }),

  // 檢查並建立維護提醒
  checkAndCreateMaintenanceNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create maintenance notifications" });
    }

    try {
      const tools = await getAllTools();
      const notifications = [];

      for (const tool of tools) {
        // 檢查週期性維護
        if (tool.nextMaintenanceDate && new Date(tool.nextMaintenanceDate) <= new Date()) {
          await createMaintenanceNotification({
            toolId: tool.id,
            notificationType: "cycle_based",
            notificationDate: new Date(),
            isNotified: false,
          });

          notifications.push({
            toolId: tool.id,
            toolName: tool.name,
            type: "cycle_based",
          });
        }

        // 檢查使用次數維護
        if (tool.usageCount && tool.usageCount >= (tool.maintenanceThreshold || 100)) {
          await createMaintenanceNotification({
            toolId: tool.id,
            notificationType: "usage_based",
            notificationDate: new Date(),
            isNotified: false,
          });

          notifications.push({
            toolId: tool.id,
            toolName: tool.name,
            type: "usage_based",
          });
        }
      }

      // 發送通知給管理員
      if (notifications.length > 0) {
        const notificationList = notifications.map((n) => `${n.toolName} (${n.type})`).join(", ");
        await notifyOwner({
          title: "工具維護提醒",
          content: `以下工具需要進行維護：${notificationList}`,
        });
      }

      return { success: true, notificationsCreated: notifications.length };
    } catch (error) {
      console.error("Failed to check and create maintenance notifications:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create maintenance notifications" });
    }
  }),

  // 獲取未通知的維護提醒
  getUnnotifiedNotifications: protectedProcedure.query(async () => {
    try {
      const notifications = await getUnnotifiedMaintenanceNotifications();
      return notifications;
    } catch (error) {
      console.error("Failed to fetch unnotified notifications:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch notifications" });
    }
  }),
});
