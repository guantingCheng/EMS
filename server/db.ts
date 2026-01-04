import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tools, borrowRecords, returnRecords, maintenanceRecords, maintenanceNotifications, InsertTool, InsertBorrowRecord, InsertReturnRecord, InsertMaintenanceRecord, InsertMaintenanceNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 工具相關查詢
export async function getAllTools() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tools);
}

export async function getToolById(toolId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tools).where(eq(tools.id, toolId)).limit(1);
  return result[0];
}

export async function createTool(data: InsertTool) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tools).values(data);
  return result;
}

export async function updateTool(toolId: number, data: Partial<InsertTool>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tools).set(data).where(eq(tools.id, toolId));
}

export async function deleteTool(toolId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tools).where(eq(tools.id, toolId));
}

// 借用記錄相關查詢
export async function createBorrowRecord(data: InsertBorrowRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(borrowRecords).values(data);
  return result;
}

export async function getBorrowRecordById(recordId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(borrowRecords).where(eq(borrowRecords.id, recordId)).limit(1);
  return result[0];
}

export async function getBorrowRecordsByToolId(toolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(borrowRecords).where(eq(borrowRecords.toolId, toolId));
}

export async function getActiveBorrowRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(borrowRecords).where(eq(borrowRecords.status, "borrowed"));
}

// 歸還記錄相關查詢
export async function createReturnRecord(data: InsertReturnRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(returnRecords).values(data);
}

export async function getReturnRecordsByToolId(toolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnRecords).where(eq(returnRecords.toolId, toolId));
}

// 維護記錄相關查詢
export async function createMaintenanceRecord(data: InsertMaintenanceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(maintenanceRecords).values(data);
}

export async function getMaintenanceRecordsByToolId(toolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.toolId, toolId));
}

// 維護提醒相關查詢
export async function createMaintenanceNotification(data: InsertMaintenanceNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(maintenanceNotifications).values(data);
}

export async function getUnnotifiedMaintenanceNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceNotifications).where(eq(maintenanceNotifications.isNotified, false));
}
