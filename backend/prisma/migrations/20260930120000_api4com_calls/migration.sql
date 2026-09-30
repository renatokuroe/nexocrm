-- AlterTable
ALTER TABLE `users` ADD COLUMN `phoneExtension` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `calls` (
    `id` VARCHAR(191) NOT NULL,
    `api4comId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `status` ENUM('DIALING', 'ANSWERED', 'NOT_ANSWERED', 'BUSY', 'FAILED') NOT NULL DEFAULT 'DIALING',
    `duration` INTEGER NULL,
    `hangupCause` VARCHAR(191) NULL,
    `recordUrl` TEXT NULL,
    `answeredAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NULL,

    UNIQUE INDEX `calls_api4comId_key`(`api4comId`),
    INDEX `calls_clientId_idx`(`clientId`),
    INDEX `calls_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calls` ADD CONSTRAINT `calls_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

