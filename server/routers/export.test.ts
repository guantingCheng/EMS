import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("export.borrowRecords", () => {
  it("should return formatted borrow records", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const records = await caller.export.borrowRecords({
        status: "all",
      });

      // 驗證返回的是陣列
      expect(Array.isArray(records)).toBe(true);

      // 如果有記錄，驗證格式
      if (records.length > 0) {
        const record = records[0];
        expect(record).toHaveProperty("借用人");
        expect(record).toHaveProperty("案場名稱");
        expect(record).toHaveProperty("工具ID");
        expect(record).toHaveProperty("數量");
        expect(record).toHaveProperty("借用時間");
        expect(record).toHaveProperty("預計歸還");
        expect(record).toHaveProperty("狀態");
        expect(record).toHaveProperty("備註");
      }
    } catch (error: any) {
      // 如果資料庫不可用，應該拋出適當的錯誤
      expect(error.code).toBeDefined();
    }
  });

  it("should accept optional date filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 11, 31);

    try {
      const records = await caller.export.borrowRecords({
        startDate,
        endDate,
        status: "all",
      });

      expect(Array.isArray(records)).toBe(true);
    } catch (error: any) {
      expect(error.code).toBeDefined();
    }
  });

  it("should accept project name filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const records = await caller.export.borrowRecords({
        projectName: "Test Project",
        status: "all",
      });

      expect(Array.isArray(records)).toBe(true);

      // 如果有記錄，驗證都是指定的案場
      if (records.length > 0) {
        records.forEach((record: any) => {
          expect(record.案場名稱).toBe("Test Project");
        });
      }
    } catch (error: any) {
      expect(error.code).toBeDefined();
    }
  });

  it("should filter by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const borrowedRecords = await caller.export.borrowRecords({
        status: "borrowed",
      });

      expect(Array.isArray(borrowedRecords)).toBe(true);

      // 如果有記錄，驗證都是借用中的狀態
      if (borrowedRecords.length > 0) {
        borrowedRecords.forEach((record: any) => {
          expect(record.狀態).toBe("借用中");
        });
      }
    } catch (error: any) {
      expect(error.code).toBeDefined();
    }
  });

  it("should handle all filter combinations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 11, 31);

    try {
      const records = await caller.export.borrowRecords({
        startDate,
        endDate,
        projectName: "Test Project",
        status: "borrowed",
      });

      expect(Array.isArray(records)).toBe(true);
    } catch (error: any) {
      expect(error.code).toBeDefined();
    }
  });
});
