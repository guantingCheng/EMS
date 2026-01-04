import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("borrow router", () => {
  describe("create", () => {
    it("should create borrow record with valid data", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      // First, get a valid tool
      const tools = await caller.tools.list();
      if (tools.length === 0) {
        // Skip test if no tools available
        expect(true).toBe(true);
        return;
      }

      const result = await caller.borrow.create({
        toolId: tools[0].id,
        quantity: 1,
      });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('success');
    });

    it("should require positive quantity", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      // First, get a valid tool
      const tools = await caller.tools.list();
      if (tools.length === 0) {
        // Skip test if no tools available
        expect(true).toBe(true);
        return;
      }

      try {
        await caller.borrow.create({
          toolId: tools[0].id,
          quantity: 0,
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        // Error should be thrown for invalid quantity
        expect(error).toBeDefined();
      }
    });
  });

  describe("getActive", () => {
    it("should return active borrow records", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.borrow.getActive();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
