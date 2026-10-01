-- ============================================================
-- Migration: Remove redundant project_id from class child tables
-- ตาราง: class_attributes, class_implements, class_methods
-- วิธี: เพิ่ม surrogate_id (AUTO_INCREMENT) ให้ classes
--       แล้วให้ตารางลูกอ้างถึง surrogate_id แทน composite FK
-- ============================================================

START TRANSACTION;

-- ----------------------------------------------------------------
-- STEP 1: เพิ่ม surrogate_id ให้ตาราง classes
-- ----------------------------------------------------------------
ALTER TABLE `classes`
    ADD COLUMN `surrogate_id` INT NOT NULL AUTO_INCREMENT FIRST,
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (`surrogate_id`),
    ADD UNIQUE KEY `uq_class_per_project` (`id`, `project_id`);

-- ----------------------------------------------------------------
-- STEP 2: ลบ FK constraints เดิมออกก่อน (composite FK)
-- ----------------------------------------------------------------
ALTER TABLE `class_attributes`
    DROP FOREIGN KEY `class_attributes_ibfk_1`;

ALTER TABLE `class_implements`
    DROP FOREIGN KEY `class_implements_ibfk_1`;

ALTER TABLE `class_methods`
    DROP FOREIGN KEY `class_methods_ibfk_1`;

-- ----------------------------------------------------------------
-- STEP 3: เพิ่ม column class_surrogate_id ในตารางลูก
-- ----------------------------------------------------------------

ALTER TABLE `class_attributes`
    ADD COLUMN `class_surrogate_id` INT DEFAULT NULL AFTER `class_id`;

UPDATE `class_attributes` ca
JOIN `classes` c ON ca.class_id = c.id AND ca.project_id = c.project_id
SET ca.class_surrogate_id = c.surrogate_id;

ALTER TABLE `class_implements`
    ADD COLUMN `class_surrogate_id` INT DEFAULT NULL AFTER `class_id`;

UPDATE `class_implements` ci
JOIN `classes` c ON ci.class_id = c.id AND ci.project_id = c.project_id
SET ci.class_surrogate_id = c.surrogate_id;

ALTER TABLE `class_methods`
    ADD COLUMN `class_surrogate_id` INT DEFAULT NULL AFTER `class_id`;

UPDATE `class_methods` cm
JOIN `classes` c ON cm.class_id = c.id AND cm.project_id = c.project_id
SET cm.class_surrogate_id = c.surrogate_id;

-- ----------------------------------------------------------------
-- STEP 4: ลบ index composite เดิม
-- ----------------------------------------------------------------
ALTER TABLE `class_attributes`  DROP INDEX `class_attributes_ibfk_1`;
ALTER TABLE `class_implements`  DROP INDEX `class_implements_ibfk_1`;
ALTER TABLE `class_methods`     DROP INDEX `class_methods_ibfk_1`;

-- ----------------------------------------------------------------
-- STEP 5: ลบ project_id และ class_id (text) ออกจากตารางลูก
-- ----------------------------------------------------------------
ALTER TABLE `class_attributes`
    MODIFY COLUMN `class_surrogate_id` INT NOT NULL,
    DROP COLUMN `class_id`,
    DROP COLUMN `project_id`;

ALTER TABLE `class_implements`
    MODIFY COLUMN `class_surrogate_id` INT NOT NULL,
    DROP COLUMN `class_id`,
    DROP COLUMN `project_id`;

ALTER TABLE `class_methods`
    MODIFY COLUMN `class_surrogate_id` INT NOT NULL,
    DROP COLUMN `class_id`,
    DROP COLUMN `project_id`;

-- ----------------------------------------------------------------
-- STEP 6: เพิ่ม FK constraints ใหม่ + index
-- ----------------------------------------------------------------
ALTER TABLE `class_attributes`
    ADD CONSTRAINT `class_attributes_ibfk_1`
        FOREIGN KEY (`class_surrogate_id`) REFERENCES `classes` (`surrogate_id`) ON DELETE CASCADE,
    ADD INDEX `idx_class_surrogate_id` (`class_surrogate_id`);

ALTER TABLE `class_implements`
    ADD CONSTRAINT `class_implements_ibfk_1`
        FOREIGN KEY (`class_surrogate_id`) REFERENCES `classes` (`surrogate_id`) ON DELETE CASCADE,
    ADD INDEX `idx_class_surrogate_id` (`class_surrogate_id`);

ALTER TABLE `class_methods`
    ADD CONSTRAINT `class_methods_ibfk_1`
        FOREIGN KEY (`class_surrogate_id`) REFERENCES `classes` (`surrogate_id`) ON DELETE CASCADE,
    ADD INDEX `idx_class_surrogate_id` (`class_surrogate_id`);

COMMIT;
