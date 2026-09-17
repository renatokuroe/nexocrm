ALTER TABLE `segments` MODIFY `color` VARCHAR(191) NOT NULL DEFAULT '#ff0000';
ALTER TABLE `stages` MODIFY `color` VARCHAR(191) NOT NULL DEFAULT '#ff0000';
ALTER TABLE `labels` MODIFY `color` VARCHAR(191) NOT NULL DEFAULT '#ff0000';

UPDATE `segments`
SET `color` = '#ff0000'
WHERE `color` IN ('#6366f1', '#8b5cf6');

UPDATE `stages`
SET `color` = '#ff0000'
WHERE `color` IN ('#6366f1', '#8b5cf6');

UPDATE `labels`
SET `color` = '#ff0000'
WHERE `color` IN ('#6366f1', '#8b5cf6');