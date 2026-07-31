CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`action` text NOT NULL,
	`module` text NOT NULL,
	`record_id` text DEFAULT '' NOT NULL,
	`old_value` text DEFAULT '' NOT NULL,
	`new_value` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_uq` ON `brands` (`name`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_uq` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`client_type` text DEFAULT 'empresa' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`counter_email` text NOT NULL,
	`approver_email` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventories_number_unique` ON `inventories` (`number`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`expected_stock` real NOT NULL,
	`counted_stock` real NOT NULL,
	`difference` real NOT NULL,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`previous_stock` real NOT NULL,
	`new_stock` real NOT NULL,
	`origin` text DEFAULT '' NOT NULL,
	`destination` text DEFAULT '' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`user_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` integer,
	`brand_id` integer,
	`supplier_id` integer,
	`warehouse_id` integer,
	`location` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT 'UN' NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL,
	`current_stock` real DEFAULT 0 NOT NULL,
	`reserved_stock` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`lot_control` integer DEFAULT false NOT NULL,
	`serial_control` integer DEFAULT false NOT NULL,
	`expiry_date` text,
	`image_url` text DEFAULT '' NOT NULL,
	`sale_blocked` integer DEFAULT false NOT NULL,
	`purchase_blocked` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_uq` ON `products` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_uq` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_cost` real NOT NULL,
	`total` real NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`supplier_id` integer,
	`document` text DEFAULT '' NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'recebida' NOT NULL,
	`responsible_email` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_number_unique` ON `purchases` (`number`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`client_id` integer,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'aberta' NOT NULL,
	`payment_method` text DEFAULT 'informativo' NOT NULL,
	`seller_email` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_number_unique` ON `sales` (`number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` text DEFAULT 'sistema' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`carrier` text NOT NULL,
	`tracking_code` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'expedido' NOT NULL,
	`responsible_email` text NOT NULL,
	`occurrence` text DEFAULT '' NOT NULL,
	`shipped_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	`lead_time_days` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'operador' NOT NULL,
	`status` text DEFAULT 'ativo' NOT NULL,
	`last_access` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
