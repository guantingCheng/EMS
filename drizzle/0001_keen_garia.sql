CREATE TABLE `borrowRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`borrowerId` int NOT NULL,
	`borrowerName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`borrowTime` timestamp NOT NULL DEFAULT (now()),
	`expectedReturnTime` timestamp,
	`actualReturnTime` timestamp,
	`status` enum('borrowed','returned','overdue') NOT NULL DEFAULT 'borrowed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `borrowRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`notificationType` enum('cycle_based','usage_based') NOT NULL,
	`notificationDate` timestamp NOT NULL,
	`isNotified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenanceNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`maintenanceDate` timestamp NOT NULL DEFAULT (now()),
	`maintenanceContent` text NOT NULL,
	`maintainedBy` varchar(255) NOT NULL,
	`nextMaintenanceDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `returnRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`borrowRecordId` int NOT NULL,
	`toolId` int NOT NULL,
	`returnerId` int NOT NULL,
	`returnerName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`returnTime` timestamp NOT NULL DEFAULT (now()),
	`condition` enum('good','minor_damage','major_damage') NOT NULL DEFAULT 'good',
	`conditionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `returnRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`specification` text,
	`totalQuantity` int NOT NULL DEFAULT 0,
	`availableQuantity` int NOT NULL DEFAULT 0,
	`photoUrl` text,
	`maintenanceCycleDays` int,
	`lastMaintenanceDate` timestamp,
	`nextMaintenanceDate` timestamp,
	`usageCount` int DEFAULT 0,
	`maintenanceThreshold` int DEFAULT 100,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_id` PRIMARY KEY(`id`)
);
