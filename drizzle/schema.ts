import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 工具資料表
export const tools = mysqlTable("tools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  specification: text("specification"),
  totalQuantity: int("totalQuantity").notNull().default(0),
  availableQuantity: int("availableQuantity").notNull().default(0),
  photoUrl: longtext("photoUrl"),
  maintenanceCycleDays: int("maintenanceCycleDays"),
  lastMaintenanceDate: timestamp("lastMaintenanceDate"),
  nextMaintenanceDate: timestamp("nextMaintenanceDate"),
  usageCount: int("usageCount").default(0),
  maintenanceThreshold: int("maintenanceThreshold").default(100),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tool = typeof tools.$inferSelect;
export type InsertTool = typeof tools.$inferInsert;

// 借用記錄表
export const borrowRecords = mysqlTable("borrowRecords", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  borrowerId: int("borrowerId").notNull(),
  borrowerName: varchar("borrowerName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  borrowTime: timestamp("borrowTime").defaultNow().notNull(),
  expectedReturnTime: timestamp("expectedReturnTime"),
  actualReturnTime: timestamp("actualReturnTime"),
  status: mysqlEnum("status", ["borrowed", "returned", "overdue"]).default("borrowed").notNull(),
  projectName: varchar("projectName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BorrowRecord = typeof borrowRecords.$inferSelect;
export type InsertBorrowRecord = typeof borrowRecords.$inferInsert;

// 歸還記錄表
export const returnRecords = mysqlTable("returnRecords", {
  id: int("id").autoincrement().primaryKey(),
  borrowRecordId: int("borrowRecordId").notNull(),
  toolId: int("toolId").notNull(),
  returnerId: int("returnerId").notNull(),
  returnerName: varchar("returnerName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  returnTime: timestamp("returnTime").defaultNow().notNull(),
  condition: mysqlEnum("condition", ["good", "minor_damage", "major_damage"]).default("good").notNull(),
  conditionNotes: text("conditionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReturnRecord = typeof returnRecords.$inferSelect;
export type InsertReturnRecord = typeof returnRecords.$inferInsert;

// 維護記錄表
export const maintenanceRecords = mysqlTable("maintenanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  maintenanceDate: timestamp("maintenanceDate").defaultNow().notNull(),
  maintenanceContent: text("maintenanceContent").notNull(),
  maintainedBy: varchar("maintainedBy", { length: 255 }).notNull(),
  nextMaintenanceDate: timestamp("nextMaintenanceDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

// 維護提醒表
export const maintenanceNotifications = mysqlTable("maintenanceNotifications", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  notificationType: mysqlEnum("notificationType", ["cycle_based", "usage_based"]).notNull(),
  notificationDate: timestamp("notificationDate").notNull(),
  isNotified: boolean("isNotified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaintenanceNotification = typeof maintenanceNotifications.$inferSelect;
export type InsertMaintenanceNotification = typeof maintenanceNotifications.$inferInsert;