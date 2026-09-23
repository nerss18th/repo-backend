-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Sep 23, 2026 at 01:38 AM
-- Server version: 8.0.46
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ontology_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_actions`
--

CREATE TABLE `activity_actions` (
  `id` int NOT NULL,
  `activity_diagram_id` int NOT NULL,
  `action_no` varchar(50) NOT NULL,
  `lane_no` varchar(50) DEFAULT '',
  `caption` varchar(255) DEFAULT '',
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_actions`
--

INSERT INTO `activity_actions` (`id`, `activity_diagram_id`, `action_no`, `lane_no`, `caption`, `description`) VALUES
(9, 8, 'A-01', '', 'กหฟ', 'กหฟ'),
(19, 9, 'A-01', 'L-02', 'แสดงหน้า Promotion', 'แสดงหน้า Promotion'),
(20, 9, 'A-02', 'L-01', 'เลือก Plan ที่ต้องการ', 'เลือก Plan ที่ต้องการ'),
(21, 9, 'A-03', 'L-02', 'อัปเดต Plan ของ User', 'อัปเดต Plan ของ User'),
(22, 9, 'A-04', 'L-02', 'Redirect ไปหน้า Dashboard', 'Redirect ไปหน้า Dashboard'),
(23, 10, 'A-01', 'L-01', 'เข้าหน้า Profile', 'เข้าหน้า Profile'),
(24, 10, 'A-02', 'L-01', 'แก้ไข ชื่อ / เบอร์โทร / email / description', 'แก้ไข ชื่อ / เบอร์โทร / email / description'),
(25, 10, 'A-03', 'L-01', 'กดบันทึก', 'กดบันทึก'),
(26, 10, 'A-04', 'L-02', 'บันทึกข้อมูล', 'บันทึกข้อมูล'),
(27, 10, 'A-05', 'L-02', 'แสดงข้อความแก้ไขสำเร็จ', 'แสดงข้อความแก้ไขสำเร็จ');

-- --------------------------------------------------------

--
-- Table structure for table `activity_decision_criteria`
--

CREATE TABLE `activity_decision_criteria` (
  `id` int NOT NULL,
  `decision_node_id` int NOT NULL,
  `criteria_no` varchar(50) NOT NULL,
  `detail` text,
  `reference_id` varchar(50) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_decision_criteria`
--

INSERT INTO `activity_decision_criteria` (`id`, `decision_node_id`, `criteria_no`, `detail`, `reference_id`) VALUES
(6, 6, 'C-01', 'กหฟ', 'A-01');

-- --------------------------------------------------------

--
-- Table structure for table `activity_decision_nodes`
--

CREATE TABLE `activity_decision_nodes` (
  `id` int NOT NULL,
  `activity_diagram_id` int NOT NULL,
  `decision_no` varchar(50) NOT NULL,
  `lane_no` varchar(50) DEFAULT '',
  `from_action_no` varchar(50) DEFAULT '',
  `caption` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_decision_nodes`
--

INSERT INTO `activity_decision_nodes` (`id`, `activity_diagram_id`, `decision_no`, `lane_no`, `from_action_no`, `caption`) VALUES
(6, 8, 'D-01', '', 'A-01', 'กหฟ');

-- --------------------------------------------------------

--
-- Table structure for table `activity_diagrams`
--

CREATE TABLE `activity_diagrams` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `activity_id` varchar(50) NOT NULL,
  `activity_name` varchar(255) NOT NULL,
  `use_case_ref` varchar(255) DEFAULT '',
  `preliminary_activity_id` varchar(50) DEFAULT '',
  `description` text,
  `image_path` longtext,
  `file_name` varchar(255) DEFAULT NULL,
  `has_swimlane` varchar(10) DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_diagrams`
--

INSERT INTO `activity_diagrams` (`id`, `project_id`, `activity_id`, `activity_name`, `use_case_ref`, `preliminary_activity_id`, `description`, `image_path`, `file_name`, `has_swimlane`, `created_at`) VALUES
(8, 1, 'ACT-01', 'กหฟ', 'UC-01 (สมาชิก)', '', 'กหฟ', '/diagram_pic/activity/diagram_activity_pro_91547.png', 'แบบแผนที่ยังไม่ได้ตั้งชื่อ.drawio (1).png', 'No', '2026-09-16 08:14:31'),
(9, 8, 'ACT-01', 'เลือก Plan ตอนสมัคร', 'UC-04 (จัดการข้อมูลผู้ใช้งาน)', '', 'เลือก Plan ตอนสมัคร', '/diagram_pic/activity/diagram_activity_pro_11604.jpg', 'ทดสอบActivity1.jpg', 'Yes', '2026-09-17 16:36:41'),
(10, 8, 'ACT-02', 'แก้ไขข้อมูลส่วนตัว', 'UC-04 (จัดการข้อมูลผู้ใช้งาน)', '', 'แก้ไขข้อมูลส่วนตัว', '/diagram_pic/activity/diagram_activity_pro_20561.jpg', 'ทดสอบActivity2.jpg', 'Yes', '2026-09-17 16:38:50');

-- --------------------------------------------------------

--
-- Table structure for table `activity_end_points`
--

CREATE TABLE `activity_end_points` (
  `id` int NOT NULL,
  `activity_diagram_id` int NOT NULL,
  `lane_no` varchar(50) DEFAULT '',
  `from_type` varchar(50) DEFAULT '',
  `from_no` varchar(50) DEFAULT '',
  `end_state` varchar(20) DEFAULT 'Success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_end_points`
--

INSERT INTO `activity_end_points` (`id`, `activity_diagram_id`, `lane_no`, `from_type`, `from_no`, `end_state`) VALUES
(6, 8, '', 'Action', '', 'Success'),
(9, 9, 'L-02', 'Action', 'A-04', 'Success'),
(10, 10, 'L-02', 'Action', 'A-05', 'Success');

-- --------------------------------------------------------

--
-- Table structure for table `activity_start_points`
--

CREATE TABLE `activity_start_points` (
  `id` int NOT NULL,
  `activity_diagram_id` int NOT NULL,
  `from_lane_no` varchar(50) DEFAULT '',
  `to_action` varchar(100) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_start_points`
--

INSERT INTO `activity_start_points` (`id`, `activity_diagram_id`, `from_lane_no`, `to_action`) VALUES
(6, 8, '', 'A-01'),
(9, 9, 'L-02', 'A-01'),
(10, 10, 'L-01', 'A-01');

-- --------------------------------------------------------

--
-- Table structure for table `activity_swimlanes`
--

CREATE TABLE `activity_swimlanes` (
  `id` int NOT NULL,
  `activity_diagram_id` int NOT NULL,
  `lane_no` varchar(50) NOT NULL,
  `type` varchar(100) DEFAULT '',
  `caption` varchar(255) DEFAULT '',
  `reference_id` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_swimlanes`
--

INSERT INTO `activity_swimlanes` (`id`, `activity_diagram_id`, `lane_no`, `type`, `caption`, `reference_id`) VALUES
(10, 8, 'L-01', 'User', 'User Lane', 'REF-01'),
(15, 9, 'L-01', 'User', 'User Lane', 'SL-01'),
(16, 9, 'L-02', 'System', 'System Lane', 'SL-02'),
(17, 10, 'L-01', 'User', 'User Lane', 'SL-01'),
(18, 10, 'L-02', 'System', 'System Lane', 'SL-02');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Class','Abstract class','Interface') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Class',
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `extend_to_class_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` int NOT NULL DEFAULT '1',
  `extend_to_class` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'None'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `name`, `type`, `reference`, `description`, `extend_to_class_id`, `project_id`, `extend_to_class`) VALUES
('CL-01', 'test01', 'Class', 'UC-01', 'ทดสอบ 1', NULL, 1, 'None'),
('CL-01', 'ProjectMember', 'Class', 'UC-06', 'Class ที่ใช้เก็บข้อมูลของสมาชิกใน Team ใน Project', NULL, 8, 'None'),
('CL-02', 'zxc', 'Class', 'UC-02', 'zxc', 'CL-01', 1, 'test01');

-- --------------------------------------------------------

--
-- Table structure for table `class_attributes`
--

CREATE TABLE `class_attributes` (
  `id` int NOT NULL,
  `class_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `encapsulation` enum('private','public','protected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'public',
  `data_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_size` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `example_format` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_attributes`
--

INSERT INTO `class_attributes` (`id`, `class_id`, `name`, `encapsulation`, `data_type`, `data_size`, `description`, `example_format`, `project_id`) VALUES
(1, 'CL-01', 'x1', 'private', 'String', '10', 'x1', 'x1', 1),
(2, 'CL-02', 'zxc', 'private', 'String', '10', 'zxc', 'zxc', 1),
(3, 'CL-01', 'id', 'private', 'int', '100', 'ID ของ member', '1', 8);

-- --------------------------------------------------------

--
-- Table structure for table `class_implements`
--

CREATE TABLE `class_implements` (
  `id` int NOT NULL,
  `class_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL DEFAULT '1',
  `class_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `impl_class_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_implements`
--

INSERT INTO `class_implements` (`id`, `class_id`, `project_id`, `class_name`, `impl_class_id`) VALUES
(1, 'CL-02', 1, 'test01', 'CL-01');

-- --------------------------------------------------------

--
-- Table structure for table `class_methods`
--

CREATE TABLE `class_methods` (
  `id` int NOT NULL,
  `class_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Constructor/Overload','Method','Abstract Method') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Method',
  `encapsulation` enum('private','public','protected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'public',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `return_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_data_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'void',
  `return_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `project_id` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_methods`
--

INSERT INTO `class_methods` (`id`, `class_id`, `type`, `encapsulation`, `name`, `description`, `return_value`, `return_data_type`, `return_description`, `project_id`) VALUES
(1, 'CL-01', 'Method', 'public', 'y1', 'y1', 'z1', 'void', 'z1', 1),
(2, 'CL-02', 'Method', 'public', 'zxc', 'zxc', 'zxc', 'void', 'zxc', 1),
(3, 'CL-01', 'Method', 'public', 'getRole', 'การให้ Role กับ Member ในสมาชิก', '', 'void', '', 8);

-- --------------------------------------------------------

--
-- Table structure for table `diagrams`
--

CREATE TABLE `diagrams` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `type` enum('use-case','class','activity') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pic` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `diagrams`
--

INSERT INTO `diagrams` (`id`, `project_id`, `type`, `title`, `file_name`, `image_path`, `pic`) VALUES
(11, 1, 'use-case', 'Use Case Diagram', 'แบบแผนที่ยังไม่ได้ตั้งชื่อ (4).jpg', '/diagram_pic/use-case/diagram_use-case_pro_62271.jpg', '/diagram_pic/use-case/diagram_use-case_pro_62271.jpg'),
(12, 1, 'class', 'Class Diagram', 'แบบแผนที่ยังไม่ได้ตั้งชื่อ (4).jpg', '/diagram_pic/class/diagram_class_pro_39120.jpg', '/diagram_pic/class/diagram_class_pro_39120.jpg'),
(13, 1, 'activity', 'Use Case Diagram', 'แบบแผนที่ยังไม่ได้ตั้งชื่อ (4).jpg', '/diagram_pic/activity/diagram_activity_pro_30140.jpg', '/diagram_pic/activity/diagram_activity_pro_30140.jpg'),
(14, 8, 'use-case', 'Use Case Diagram', 'ทดสอบUseCase.jpg', '/diagram_pic/use-case/diagram_use-case_pro_63045.jpg', '/diagram_pic/use-case/diagram_use-case_pro_63045.jpg'),
(15, 8, 'class', 'Class Diagram', 'ทดสอบClass.jpg', '/diagram_pic/class/diagram_class_pro_79150.jpg', '/diagram_pic/class/diagram_class_pro_79150.jpg'),
(16, 8, 'activity', 'Use Case Diagram', 'ex-diagram.png', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `method_parameters`
--

CREATE TABLE `method_parameters` (
  `id` int NOT NULL,
  `method_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `method_parameters`
--

INSERT INTO `method_parameters` (`id`, `method_id`, `name`, `data_type`, `description`) VALUES
(1, 1, 'a1', 'String', 'a1'),
(2, 2, 'zxc', 'String', 'zxc');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `detail`, `created_by`) VALUES
(1, 'Test Project', 'ทดสอบ', 10),
(8, 'Project ทดสอบการทำงาน', 'ทดสอบการทำงาน', 10);

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

CREATE TABLE `project_members` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Owner','Editor','Viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Editor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_members`
--

INSERT INTO `project_members` (`id`, `project_id`, `user_id`, `email`, `role`) VALUES
(1, 1, 10, 'pro@gmail.com', 'Owner'),
(9, 8, 10, 'pro@gmail.com', 'Owner'),
(10, 1, 9, 'standard@gmail.com', 'Editor');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan` enum('Standard','Pro','Admin') COLLATE utf8mb4_unicode_ci DEFAULT 'Standard',
  `pic` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `username`, `name`, `phone`, `plan`, `pic`, `description`, `role`) VALUES
(5, 'user@example.com', '$2b$10$GRcof5G30t452I90enrr0enPnzvwHYoeAPIX0qV15Ua3UYXRA.poS', 'johndoe', NULL, '0812345678', 'Standard', NULL, NULL, 'user'),
(6, 'test_signup@gmail.com', 'hashedpass', 'Test User', NULL, NULL, 'Standard', NULL, NULL, 'user'),
(7, 'person_test02@gmail.com', '$2b$10$52dwphIXwk4SJYXzxWWi1e2.xgHIZ9qKD5IUOk7tCVhqKXYSoB8S6', 'person_test02', 'Natchanan Ratchasak', '0123456789', 'Pro', NULL, NULL, 'user'),
(8, 'user_with_name@gmail.com', 'hashedpass', 'john_username', 'John Doe', NULL, 'Standard', NULL, NULL, 'user'),
(9, 'standard@gmail.com', '$2b$10$ushz.6OHVF.GUVLnewMuoulmO/JWcSphWgakWdYzhgZvCykjE2Yx6', 'standard', 'Standard User', '0123456789', 'Standard', '/user_pic/user-1789656023007-574832842.jpg', NULL, 'user'),
(10, 'pro@gmail.com', '$2b$10$7lszxSwdDj0nYv1puUEZnOe.gJB1UP30uyJo9T9Z1aUYa5WIiE9Nu', 'pro', 'pro', NULL, 'Pro', NULL, NULL, 'user'),
(11, 'admin@gmail.com', '$2b$10$Gqtq3r7E5Rud9wOOH1mRdeNK2X/RXUkZoa.ScYiLDw5vyu7r4EVs2', 'admin', 'Admin', NULL, 'Admin', NULL, NULL, 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `use_cases`
--

CREATE TABLE `use_cases` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Use Case','Actor') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Use Case',
  `caption` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `project_id` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `use_cases`
--

INSERT INTO `use_cases` (`id`, `type`, `caption`, `description`, `project_id`) VALUES
('UC-01', 'Actor', 'สมาชิกx', 'สมาชิกที่ลงชื่อเข้าใช้', 8),
('UC-02', 'Actor', 'ผู้ดูแลระบบ', 'ผู้ที่ดูแลระบบในหลังบ้าน', 1),
('UC-02', 'Actor', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบทั้งหมด', 8),
('UC-03', 'Actor', 'ผู้ใช้งาน', 'ผู้ใช้งานที่รวมทั้ง สมาชิกและผู้ดูแลระบบ', 1),
('UC-03', 'Actor', 'ผู้ใช้งาน', 'ผู้ที่สามารถใช้งานระบบนี้ได้', 8),
('UC-04', 'Use Case', 'จัดการข้อมูลผู้ใช้งาน', 'เพิ่ม / ลบ / แก้ไข ข้อมูลผู้ใช้งาน', 8),
('UC-05', 'Use Case', 'จัดการข้อมูลเกี่ยวกับโปรเจค', 'เพิ่ม / ลบ / แก้ไข ข้อมูลโปรเจค', 8),
('UC-06', 'Use Case', 'จัดการ Team ในโปรเจค', 'เพิ่ม / ลบ สมาชิกใน Team', 8);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_actions`
--
ALTER TABLE `activity_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_diagram_id` (`activity_diagram_id`);

--
-- Indexes for table `activity_decision_criteria`
--
ALTER TABLE `activity_decision_criteria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `decision_node_id` (`decision_node_id`);

--
-- Indexes for table `activity_decision_nodes`
--
ALTER TABLE `activity_decision_nodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_diagram_id` (`activity_diagram_id`);

--
-- Indexes for table `activity_diagrams`
--
ALTER TABLE `activity_diagrams`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `activity_end_points`
--
ALTER TABLE `activity_end_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_diagram_id` (`activity_diagram_id`);

--
-- Indexes for table `activity_start_points`
--
ALTER TABLE `activity_start_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_diagram_id` (`activity_diagram_id`);

--
-- Indexes for table `activity_swimlanes`
--
ALTER TABLE `activity_swimlanes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_diagram_id` (`activity_diagram_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`,`project_id`);

--
-- Indexes for table `class_attributes`
--
ALTER TABLE `class_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_attributes_ibfk_1` (`class_id`,`project_id`);

--
-- Indexes for table `class_implements`
--
ALTER TABLE `class_implements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_implements_ibfk_1` (`class_id`,`project_id`);

--
-- Indexes for table `class_methods`
--
ALTER TABLE `class_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_methods_ibfk_1` (`class_id`,`project_id`);

--
-- Indexes for table `diagrams`
--
ALTER TABLE `diagrams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `method_parameters`
--
ALTER TABLE `method_parameters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `method_id` (`method_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `use_cases`
--
ALTER TABLE `use_cases`
  ADD PRIMARY KEY (`id`,`project_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_actions`
--
ALTER TABLE `activity_actions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `activity_decision_criteria`
--
ALTER TABLE `activity_decision_criteria`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `activity_decision_nodes`
--
ALTER TABLE `activity_decision_nodes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `activity_diagrams`
--
ALTER TABLE `activity_diagrams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `activity_end_points`
--
ALTER TABLE `activity_end_points`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `activity_start_points`
--
ALTER TABLE `activity_start_points`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `activity_swimlanes`
--
ALTER TABLE `activity_swimlanes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `class_attributes`
--
ALTER TABLE `class_attributes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `class_implements`
--
ALTER TABLE `class_implements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `class_methods`
--
ALTER TABLE `class_methods`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `diagrams`
--
ALTER TABLE `diagrams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `method_parameters`
--
ALTER TABLE `method_parameters`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_actions`
--
ALTER TABLE `activity_actions`
  ADD CONSTRAINT `activity_actions_ibfk_1` FOREIGN KEY (`activity_diagram_id`) REFERENCES `activity_diagrams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_decision_criteria`
--
ALTER TABLE `activity_decision_criteria`
  ADD CONSTRAINT `activity_decision_criteria_ibfk_1` FOREIGN KEY (`decision_node_id`) REFERENCES `activity_decision_nodes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_decision_nodes`
--
ALTER TABLE `activity_decision_nodes`
  ADD CONSTRAINT `activity_decision_nodes_ibfk_1` FOREIGN KEY (`activity_diagram_id`) REFERENCES `activity_diagrams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_end_points`
--
ALTER TABLE `activity_end_points`
  ADD CONSTRAINT `activity_end_points_ibfk_1` FOREIGN KEY (`activity_diagram_id`) REFERENCES `activity_diagrams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_start_points`
--
ALTER TABLE `activity_start_points`
  ADD CONSTRAINT `activity_start_points_ibfk_1` FOREIGN KEY (`activity_diagram_id`) REFERENCES `activity_diagrams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_swimlanes`
--
ALTER TABLE `activity_swimlanes`
  ADD CONSTRAINT `activity_swimlanes_ibfk_1` FOREIGN KEY (`activity_diagram_id`) REFERENCES `activity_diagrams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `class_attributes`
--
ALTER TABLE `class_attributes`
  ADD CONSTRAINT `class_attributes_ibfk_1` FOREIGN KEY (`class_id`,`project_id`) REFERENCES `classes` (`id`, `project_id`) ON DELETE CASCADE;

--
-- Constraints for table `class_implements`
--
ALTER TABLE `class_implements`
  ADD CONSTRAINT `class_implements_ibfk_1` FOREIGN KEY (`class_id`,`project_id`) REFERENCES `classes` (`id`, `project_id`) ON DELETE CASCADE;

--
-- Constraints for table `class_methods`
--
ALTER TABLE `class_methods`
  ADD CONSTRAINT `class_methods_ibfk_1` FOREIGN KEY (`class_id`,`project_id`) REFERENCES `classes` (`id`, `project_id`) ON DELETE CASCADE;

--
-- Constraints for table `diagrams`
--
ALTER TABLE `diagrams`
  ADD CONSTRAINT `diagrams_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `method_parameters`
--
ALTER TABLE `method_parameters`
  ADD CONSTRAINT `method_parameters_ibfk_1` FOREIGN KEY (`method_id`) REFERENCES `class_methods` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
