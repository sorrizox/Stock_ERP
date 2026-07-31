CREATE INDEX `audit_module_idx` ON `audit_logs` (`module`,`created_at`);--> statement-breakpoint
CREATE INDEX `movements_product_idx` ON `movements` (`product_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_uq` ON `products` (`barcode`) WHERE "products"."barcode" IS NOT NULL AND "products"."barcode" <> '';--> statement-breakpoint
CREATE INDEX `sales_status_idx` ON `sales` (`status`,`created_at`);