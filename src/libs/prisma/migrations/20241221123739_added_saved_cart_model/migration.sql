-- CreateTable
CREATE TABLE `SavedCart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedCart_shop_idx`(`shop`),
    UNIQUE INDEX `SavedCart_customerId_shop_key`(`customerId`, `shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
