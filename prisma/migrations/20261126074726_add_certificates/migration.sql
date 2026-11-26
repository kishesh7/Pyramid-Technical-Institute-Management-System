-- AlterTable
ALTER TABLE `EnrollmentApplication` ADD COLUMN `completedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Program` ADD COLUMN `durationHours` INTEGER NULL,
    ADD COLUMN `durationMonths` INTEGER NULL;

-- CreateTable
CREATE TABLE `training_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationNumber` VARCHAR(30) NOT NULL,
    `applicantName` VARCHAR(255) NOT NULL,
    `data` JSON NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `training_applications_applicationNumber_key`(`applicationNumber`),
    INDEX `training_applications_createdAt_idx`(`createdAt`),
    INDEX `training_applications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `certificateNo` VARCHAR(191) NOT NULL,
    `verificationId` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `programName` VARCHAR(191) NOT NULL,
    `completionDate` DATETIME(3) NOT NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('VALID', 'REVOKED') NOT NULL DEFAULT 'VALID',
    `revokedAt` DATETIME(3) NULL,
    `revokeReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Certificate_enrollmentId_key`(`enrollmentId`),
    UNIQUE INDEX `Certificate_certificateNo_key`(`certificateNo`),
    UNIQUE INDEX `Certificate_verificationId_key`(`verificationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `EnrollmentApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
