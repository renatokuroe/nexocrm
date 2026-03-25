-- Create tenants table
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User role + tenant ownership
ALTER TABLE `users`
    ADD COLUMN `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    ADD COLUMN `tenantId` VARCHAR(191) NULL;

-- Create one tenant per existing user and link ownership
INSERT INTO `tenants` (`id`, `name`, `createdAt`, `updatedAt`)
SELECT CONCAT('tenant_', `id`), CONCAT('Workspace ', `name`), NOW(3), NOW(3)
FROM `users`;

UPDATE `users`
SET `tenantId` = CONCAT('tenant_', `id`)
WHERE `tenantId` IS NULL;

ALTER TABLE `users`
    MODIFY `tenantId` VARCHAR(191) NOT NULL;

ALTER TABLE `users`
    ADD INDEX `users_tenantId_idx`(`tenantId`),
    ADD CONSTRAINT `users_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant scoping for shared config entities
ALTER TABLE `segments` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `custom_fields` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `stages` ADD COLUMN `tenantId` VARCHAR(191) NULL;

SET @default_tenant_id := (SELECT `id` FROM `tenants` ORDER BY `createdAt` ASC LIMIT 1);

UPDATE `segments` SET `tenantId` = @default_tenant_id WHERE `tenantId` IS NULL;
UPDATE `custom_fields` SET `tenantId` = @default_tenant_id WHERE `tenantId` IS NULL;
UPDATE `stages` SET `tenantId` = @default_tenant_id WHERE `tenantId` IS NULL;

ALTER TABLE `segments`
    MODIFY `tenantId` VARCHAR(191) NOT NULL,
    ADD INDEX `segments_tenantId_idx`(`tenantId`),
    ADD CONSTRAINT `segments_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `custom_fields`
    MODIFY `tenantId` VARCHAR(191) NOT NULL,
    ADD INDEX `custom_fields_tenantId_idx`(`tenantId`),
    ADD CONSTRAINT `custom_fields_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `stages`
    MODIFY `tenantId` VARCHAR(191) NOT NULL,
    ADD INDEX `stages_tenantId_idx`(`tenantId`),
    ADD CONSTRAINT `stages_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
