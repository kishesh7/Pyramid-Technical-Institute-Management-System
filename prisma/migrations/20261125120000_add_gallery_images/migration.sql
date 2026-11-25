CREATE TABLE `GalleryImage` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NOT NULL,
    `imageUrl` LONGTEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GalleryImage_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `GalleryImage` (`id`, `title`, `subtitle`, `imageUrl`, `displayOrder`, `updatedAt`) VALUES
    ('gallery-director', 'DIRECTOR', 'Samir Kumar & Khadka', '/gallery/samrikhadka.jpeg', 0, CURRENT_TIMESTAMP(3)),
    ('gallery-graduation-2081', 'Graduation 2081', 'Certificate distribution ceremony', '/gallery/pyramid1.png', 1, CURRENT_TIMESTAMP(3)),
    ('gallery-community-outreach', 'Community Outreach', 'Field visits for needs assessment', '/gallery/pyramid3.png', 2, CURRENT_TIMESTAMP(3)),
    ('gallery-partner-visit', 'Partner NGO Visit', 'GIZ Nepal visiting our facility', '/gallery/pyramidlogo.jpeg', 3, CURRENT_TIMESTAMP(3));
