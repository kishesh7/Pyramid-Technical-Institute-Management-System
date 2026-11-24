CREATE TABLE `Partner` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mark` VARCHAR(8) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `since` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Partner_name_key`(`name`),
    INDEX `Partner_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Partner` (`id`, `name`, `mark`, `type`, `since`, `displayOrder`, `updatedAt`) VALUES
    ('partner-undp-nepal', 'UNDP Nepal', 'UN', 'International Organization', 'Partner since 2015', 0, CURRENT_TIMESTAMP(3)),
    ('partner-snv-nepal', 'SNV Nepal', 'SNV', 'Dutch Development Org.', 'Partner since 2016', 1, CURRENT_TIMESTAMP(3)),
    ('partner-giz-nepal', 'GIZ Nepal', 'GIZ', 'German Dev. Agency', 'Partner since 2018', 2, CURRENT_TIMESTAMP(3)),
    ('partner-save-the-children', 'Save the Children', 'SC', 'International NGO', 'Partner since 2014', 3, CURRENT_TIMESTAMP(3)),
    ('partner-oxfam-nepal', 'Oxfam Nepal', 'OXF', 'International NGO', 'Partner since 2017', 4, CURRENT_TIMESTAMP(3)),
    ('partner-asian-development-bank', 'Asian Dev. Bank', 'ADB', 'Multilateral Dev. Bank', 'Partner since 2019', 5, CURRENT_TIMESTAMP(3)),
    ('partner-ctevt-nepal', 'CTEVT Nepal', 'CTEVT', 'Government Body', 'Affiliated since 2010', 6, CURRENT_TIMESTAMP(3)),
    ('partner-world-food-programme', 'World Food Programme', 'WFP', 'UN Agency', 'Partner since 2020', 7, CURRENT_TIMESTAMP(3)),
    ('partner-planning-commission', 'Nat. Planning Commission', 'NPC', 'Government of Nepal', 'Partner since 2013', 8, CURRENT_TIMESTAMP(3)),
    ('partner-helvetas-nepal', 'Helvetas Nepal', 'HLV', 'Swiss Dev. NGO', 'Partner since 2016', 9, CURRENT_TIMESTAMP(3)),
    ('partner-ddc-sunsari', 'DDC Sunsari', 'DDC', 'District Dev. Committee', 'Partner since 2010', 10, CURRENT_TIMESTAMP(3)),
    ('partner-world-bank-nepal', 'World Bank Nepal', 'WB', 'Multilateral Dev. Bank', 'Partner since 2021', 11, CURRENT_TIMESTAMP(3));
