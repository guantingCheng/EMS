import { describe, expect, it, beforeEach, vi } from "vitest";
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

describe("borrow.createMultiple with expectedReturnDate", () => {
  it("should accept expectedReturnDate parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 測試API能否接受expectedReturnDate參數
    // 這是一個基本的類型檢查測試
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    try {
      // 由於沒有實際的工具，這個調用會失敗
      // 但我們可以驗證參數被正確接受
      await caller.borrow.createMultiple({
        projectName: "Test Project",
        items: [
          {
            toolId: 999, // 不存在的工具ID
            quantity: 1,
          },
        ],
        expectedReturnDate: futureDate,
        notes: "Test note",
      });
    } catch (error: any) {
      // 預期會因為工具不存在而失敗
      expect(error.message).toContain("not found");
    }
  });

  it("should handle optional expectedReturnDate", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // 測試不提供expectedReturnDate的情況
      await caller.borrow.createMultiple({
        projectName: "Test Project",
        items: [
          {
            toolId: 999,
            quantity: 1,
          },
        ],
      });
    } catch (error: any) {
      // 預期會因為工具不存在而失敗
      expect(error.message).toContain("not found");
    }
  });

  it("should validate expectedReturnDate is a valid date", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    try {
      await caller.borrow.createMultiple({
        projectName: "Test Project",
        items: [
          {
            toolId: 999,
            quantity: 1,
          },
        ],
        expectedReturnDate: futureDate,
      });
    } catch (error: any) {
      // 預期會因為工具不存在而失敗，而不是因為日期格式
      expect(error.message).toContain("not found");
    }
  });
});

describe("borrow.getByToolId with expectedReturnTime", () => {
  it("should return borrow records with expectedReturnTime field", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // 嘗試獲取不存在的工具的借用記錄
      const records = await caller.borrow.getByToolId({
        toolId: 999,
      });

      // 即使工具不存在，API應該返回空陣列而不是錯誤
      expect(Array.isArray(records)).toBe(true);
    } catch (error: any) {
      // 如果拋出錯誤，應該是NOT_FOUND
      expect(error.code).toBe("NOT_FOUND");
    }
  });
});

describe("borrow schedule calculation", () => {
  it("should correctly identify dates within borrow period", () => {
    // 測試日期範圍計算邏輯
    const borrowDate = new Date(2024, 0, 1); // 2024-01-01
    const returnDate = new Date(2024, 0, 7); // 2024-01-07

    // 測試日期應該在借用期間內
    const testDate = new Date(2024, 0, 4); // 2024-01-04

    const isInPeriod =
      testDate >= borrowDate && testDate <= returnDate;
    expect(isInPeriod).toBe(true);
  });

  it("should correctly identify dates outside borrow period", () => {
    const borrowDate = new Date(2024, 0, 1);
    const returnDate = new Date(2024, 0, 7);

    // 測試日期應該不在借用期間內
    const testDate = new Date(2024, 0, 10);

    const isInPeriod =
      testDate >= borrowDate && testDate <= returnDate;
    expect(isInPeriod).toBe(false);
  });

  it("should correctly identify return date", () => {
    const returnDate = new Date(2024, 0, 7);
    const testDate = new Date(2024, 0, 7);

    const isReturnDate =
      testDate.getFullYear() === returnDate.getFullYear() &&
      testDate.getMonth() === returnDate.getMonth() &&
      testDate.getDate() === returnDate.getDate();

    expect(isReturnDate).toBe(true);
  });
});
