import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tools router", () => {
  describe("list", () => {
    it("should return tools list", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("search", () => {
    it("should search tools by keyword", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.search({
        keyword: "drill",
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter tools by category", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.search({
        category: "power-tools",
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter tools by status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.search({
        status: "available",
      });
      expect(Array.isArray(result)).toBe(true);
      result.forEach((tool) => {
        expect(tool.availableQuantity).toBeGreaterThan(0);
      });
    });
  });

  describe("create", () => {
    it("should allow admin to create tool", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.create({
        name: "Test Drill",
        category: "Power Tools",
        specification: "13mm",
        totalQuantity: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should prevent non-admin from creating tool", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.tools.create({
          name: "Test Drill",
          category: "Power Tools",
          specification: "13mm",
          totalQuantity: 5,
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("getCategories", () => {
    it("should return unique categories", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tools.getCategories();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
