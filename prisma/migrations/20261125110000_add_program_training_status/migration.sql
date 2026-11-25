ALTER TABLE `Program`
    ADD COLUMN `trainingStatus` ENUM('UPCOMING', 'ONGOING', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING';

UPDATE `Program` AS p
INNER JOIN `Project` AS pr ON pr.`id` = p.`projectId`
SET p.`trainingStatus` = CASE pr.`status`
    WHEN 'ACTIVE' THEN 'ONGOING'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    ELSE 'UPCOMING'
END;

CREATE INDEX `Program_trainingStatus_idx` ON `Program`(`trainingStatus`);
