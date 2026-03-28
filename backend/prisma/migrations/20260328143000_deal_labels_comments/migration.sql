CREATE TABLE `labels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `labels_tenantId_name_key`(`tenantId`, `name`),
    INDEX `labels_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `deal_labels` (
    `dealId` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `deal_labels_labelId_idx`(`labelId`),
    PRIMARY KEY (`dealId`, `labelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `labels`
    ADD CONSTRAINT `labels_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `deal_labels`
    ADD CONSTRAINT `deal_labels_dealId_fkey`
        FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `deal_labels_labelId_fkey`
        FOREIGN KEY (`labelId`) REFERENCES `labels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;