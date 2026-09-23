-- AlterTable
ALTER TABLE `clients` ADD COLUMN `placeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `clients_placeId_idx` ON `clients`(`placeId`);
