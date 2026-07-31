CREATE TABLE `product_details` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`extra_data` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`previous_status` text DEFAULT '' NOT NULL,
	`new_status` text NOT NULL,
	`observation` text DEFAULT '' NOT NULL,
	`user_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `status_history_entity_idx` ON `status_history` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `workflow_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`record_type` text DEFAULT 'registro' NOT NULL,
	`product_id` integer,
	`quantity` real DEFAULT 0 NOT NULL,
	`origin` text DEFAULT '' NOT NULL,
	`destination` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`responsible_email` text DEFAULT '' NOT NULL,
	`due_at` text,
	`amount` real DEFAULT 0 NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_module_code_uq` ON `workflow_records` (`module`,`code`);--> statement-breakpoint
CREATE INDEX `workflow_module_status_idx` ON `workflow_records` (`module`,`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `origin` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `destination` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `ip_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `device` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `endpoint` text DEFAULT '/api/erp' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `result` text DEFAULT 'sucesso' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `document_reference` text DEFAULT '' NOT NULL;