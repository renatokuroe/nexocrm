CREATE TABLE `cadences` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `cadences_userId_idx` (`userId`),
    CONSTRAINT `cadences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cadence_steps` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `channel` ENUM('TASK', 'CALL', 'EMAIL', 'WHATSAPP', 'LINKEDIN') NOT NULL DEFAULT 'TASK',
    `order` INTEGER NOT NULL,
    `delayDays` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cadenceId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `cadence_steps_cadenceId_order_key` (`cadenceId`, `order`),
    INDEX `cadence_steps_cadenceId_idx` (`cadenceId`),
    CONSTRAINT `cadence_steps_cadenceId_fkey` FOREIGN KEY (`cadenceId`) REFERENCES `cadences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cadence_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'PAUSED', 'STOPPED') NOT NULL DEFAULT 'ACTIVE',
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `cadenceId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `cadence_enrollments_cadenceId_clientId_key` (`cadenceId`, `clientId`),
    INDEX `cadence_enrollments_userId_status_idx` (`userId`, `status`),
    CONSTRAINT `cadence_enrollments_cadenceId_fkey` FOREIGN KEY (`cadenceId`) REFERENCES `cadences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `cadence_enrollments_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `cadence_enrollments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tasks` ADD COLUMN `channel` ENUM('TASK', 'CALL', 'EMAIL', 'WHATSAPP', 'LINKEDIN') NOT NULL DEFAULT 'TASK';
ALTER TABLE `tasks` ADD COLUMN `cadenceStepId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `cadenceEnrollmentId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD INDEX `tasks_cadenceStepId_idx` (`cadenceStepId`);
ALTER TABLE `tasks` ADD INDEX `tasks_cadenceEnrollmentId_idx` (`cadenceEnrollmentId`);
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_cadenceStepId_fkey` FOREIGN KEY (`cadenceStepId`) REFERENCES `cadence_steps` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_cadenceEnrollmentId_fkey` FOREIGN KEY (`cadenceEnrollmentId`) REFERENCES `cadence_enrollments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;