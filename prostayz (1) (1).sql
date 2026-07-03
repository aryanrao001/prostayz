-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 03, 2026 at 08:13 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `prostayz`
--

-- --------------------------------------------------------

--
-- Table structure for table `amenities`
--

CREATE TABLE `amenities` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `name`, `icon`, `status`) VALUES
(1, 'Free WiFi', 'Wifi', 1),
(2, 'Parking', 'Car', 1),
(3, 'Air Conditioning', 'Snowflake', 1),
(4, 'Television', 'Tv', 1),
(5, 'Swimming Pool', 'Waves', 1),
(6, 'Gym', 'Dumbbell', 1),
(7, 'Restaurant', 'Utensils', 1),
(8, 'Breakfast Included', 'Coffee', 1),
(9, 'Daily Housekeeping', 'Brush', 1),
(10, '24x7 Security', 'ShieldCheck', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `country_id` bigint(20) UNSIGNED NOT NULL,
  `state_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `country_id`, `state_id`, `name`, `latitude`, `longitude`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'New Delhi', 28.61393900, 77.20902100, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(2, 1, 2, 'Noida', 28.53551700, 77.39102900, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(3, 1, 2, 'Ghaziabad', 28.66915600, 77.45375800, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(4, 1, 2, 'Lucknow', 26.84669400, 80.94616600, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(5, 1, 3, 'Mumbai', 19.07609000, 72.87742600, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(6, 1, 3, 'Pune', 18.52043000, 73.85674300, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(7, 2, 4, 'Los Angeles', 34.05223500, -118.24368300, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(8, 2, 4, 'San Francisco', 37.77492900, -122.41941800, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(9, 2, 5, 'Houston', 29.76042700, -95.36980400, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(10, 3, 6, 'Dubai', 25.20484900, 55.27078200, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(11, 3, 7, 'Abu Dhabi', 24.45388400, 54.37734400, 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `iso2` char(2) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `phone_code` varchar(10) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `currency_symbol` varchar(10) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `name`, `iso2`, `iso3`, `phone_code`, `currency`, `currency_symbol`, `status`, `created_at`, `updated_at`) VALUES
(1, 'India', 'IN', 'IND', '+91', 'INR', '₹', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(2, 'United States', 'US', 'USA', '+1', 'USD', '$', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(3, 'United Arab Emirates', 'AE', 'ARE', '+971', 'AED', 'AED', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` bigint(20) NOT NULL,
  `vendor_id` bigint(20) NOT NULL,
  `property_type_id` int(11) NOT NULL,
  `property_name` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `star_rating` tinyint(4) DEFAULT 0,
  `contact_name` varchar(150) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `total_rooms` int(11) DEFAULT 0,
  `min_price` decimal(10,2) DEFAULT NULL,
  `max_price` decimal(10,2) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT 0,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `property_type_id`, `property_name`, `slug`, `description`, `star_rating`, `contact_name`, `contact_number`, `email`, `website`, `check_in`, `check_out`, `total_rooms`, `min_price`, `max_price`, `status`, `is_featured`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(1, 1, 7, 'Saffron Bagh Heritage Stay', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 950.00, 4200.00, 'pending', 0, NULL, NULL, '2026-06-30 10:12:38', '2026-07-01 12:07:43'),
(2, 1, 7, 'Saffron Bagh Heritage Stay', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, NULL, NULL, 'draft', 0, NULL, NULL, '2026-07-01 12:10:17', '2026-07-01 12:10:17');

-- --------------------------------------------------------

--
-- Table structure for table `property_addresses`
--

CREATE TABLE `property_addresses` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_addresses`
--

INSERT INTO `property_addresses` (`id`, `property_id`, `country`, `state`, `city`, `area`, `address`, `pincode`, `landmark`) VALUES
(1, 1, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola');

-- --------------------------------------------------------

--
-- Table structure for table `property_amenities`
--

CREATE TABLE `property_amenities` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `amenity_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_amenities`
--

INSERT INTO `property_amenities` (`id`, `property_id`, `amenity_id`) VALUES
(1, 1, 5),
(2, 1, 2),
(3, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `property_images`
--

CREATE TABLE `property_images` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_cover` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_images`
--

INSERT INTO `property_images` (`id`, `property_id`, `image`, `is_cover`, `sort_order`) VALUES
(9, 1, '1782821035515-15241376.jpg', 1, 0),
(10, 1, '1782821035520-692127231.png', 0, 1),
(11, 1, '1782821035522-746240265.png', 0, 2),
(12, 1, '1782821035523-552307190.jpg', 0, 3);

-- --------------------------------------------------------

--
-- Table structure for table `property_listing_progress`
--

CREATE TABLE `property_listing_progress` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) NOT NULL,
  `vendor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `current_step` tinyint(4) DEFAULT 1,
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress`)),
  `completed_percentage` tinyint(4) DEFAULT 0,
  `is_completed` tinyint(1) DEFAULT 0,
  `last_saved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_listing_progress`
--

INSERT INTO `property_listing_progress` (`id`, `property_id`, `vendor_id`, `current_step`, `progress`, `completed_percentage`, `is_completed`, `last_saved_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-01 12:07:43', '2026-06-30 10:12:38', '2026-07-01 12:07:43'),
(2, 2, 1, 2, '{\"basic_info\":true}', 15, 0, '2026-07-01 12:10:18', '2026-07-01 12:10:18', '2026-07-01 12:10:18');

-- --------------------------------------------------------

--
-- Table structure for table `property_policies`
--

CREATE TABLE `property_policies` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `cancellation_policy` longtext DEFAULT NULL,
  `house_rules` longtext DEFAULT NULL,
  `refund_policy` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_policies`
--

INSERT INTO `property_policies` (`id`, `property_id`, `cancellation_policy`, `house_rules`, `refund_policy`) VALUES
(1, 1, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.');

-- --------------------------------------------------------

--
-- Table structure for table `property_rules`
--

CREATE TABLE `property_rules` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `smoking_allowed` tinyint(1) DEFAULT NULL,
  `pets_allowed` tinyint(1) DEFAULT NULL,
  `parties_allowed` tinyint(1) DEFAULT NULL,
  `couples_allowed` tinyint(1) DEFAULT NULL,
  `children_allowed` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_rules`
--

INSERT INTO `property_rules` (`id`, `property_id`, `smoking_allowed`, `pets_allowed`, `parties_allowed`, `couples_allowed`, `children_allowed`) VALUES
(1, 1, 1, 0, 0, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `property_types`
--

CREATE TABLE `property_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_types`
--

INSERT INTO `property_types` (`id`, `name`, `status`, `created_at`, `updated_at`) VALUES
(2, 'Villa', 1, '2026-06-30 07:23:49', '2026-06-30 07:23:49'),
(3, 'Apartment', 1, '2026-06-30 07:23:49', '2026-06-30 07:23:49'),
(4, 'Hostel', 1, '2026-06-30 07:23:49', '2026-06-30 07:23:49'),
(7, 'luxury', 1, '2026-06-30 07:23:49', '2026-06-30 07:23:49');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` bigint(20) NOT NULL,
  `property_id` bigint(20) DEFAULT NULL,
  `room_name` varchar(255) DEFAULT NULL,
  `room_type` varchar(150) DEFAULT NULL,
  `room_category` enum('private','dorm','whole_property') DEFAULT 'private',
  `max_adults` int(11) DEFAULT NULL,
  `max_children` int(11) DEFAULT NULL,
  `total_rooms` int(11) DEFAULT NULL,
  `available_rooms` int(11) DEFAULT NULL,
  `room_size` int(11) DEFAULT NULL,
  `room_size_unit` enum('sqft','sqm') DEFAULT NULL,
  `private_bathroom` tinyint(1) DEFAULT NULL,
  `balcony` tinyint(1) DEFAULT NULL,
  `air_conditioning` tinyint(1) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `property_id`, `room_name`, `room_type`, `room_category`, `max_adults`, `max_children`, `total_rooms`, `available_rooms`, `room_size`, `room_size_unit`, `private_bathroom`, `balcony`, `air_conditioning`, `description`) VALUES
(6, 1, 'Heritage Garden Room', 'Deluxe', 'private', 1, 1, 6, 4, 210, 'sqft', 1, 0, 1, NULL),
(7, 1, 'Backpacker Mixed Dorm', 'Dormitory', 'dorm', 1, 0, 1, 1, 360, 'sqft', 0, 0, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `room_availability`
--

CREATE TABLE `room_availability` (
  `id` bigint(20) NOT NULL,
  `room_id` bigint(20) DEFAULT NULL,
  `available_date` date DEFAULT NULL,
  `available_rooms` int(11) DEFAULT NULL,
  `blocked_rooms` int(11) DEFAULT 0,
  `special_price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_beds`
--

CREATE TABLE `room_beds` (
  `id` bigint(20) NOT NULL,
  `room_id` bigint(20) DEFAULT NULL,
  `bed_type` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_beds`
--

INSERT INTO `room_beds` (`id`, `room_id`, `bed_type`, `quantity`) VALUES
(6, 6, 'Queen Bed', 1);

-- --------------------------------------------------------

--
-- Table structure for table `room_dorm_beds`
--

CREATE TABLE `room_dorm_beds` (
  `id` bigint(20) NOT NULL,
  `room_id` bigint(20) DEFAULT NULL,
  `bed_label` varchar(50) DEFAULT NULL,
  `bed_type` varchar(100) DEFAULT NULL,
  `status` enum('available','blocked','maintenance') DEFAULT 'available',
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_dorm_beds`
--

INSERT INTO `room_dorm_beds` (`id`, `room_id`, `bed_label`, `bed_type`, `status`, `price`) VALUES
(5, 7, 'Bunk A - Top', 'Bunk - Top', 'available', 750.00),
(6, 7, 'Bunk A - Bottom', 'Bunk - Bottom', 'available', 1050.00),
(7, 7, 'Bunk B - Top', 'Bunk - Top', 'available', 950.00),
(8, 7, 'Bunk B - Bottom', 'Bunk - Bottom', 'available', 499.00);

-- --------------------------------------------------------

--
-- Table structure for table `room_images`
--

CREATE TABLE `room_images` (
  `id` bigint(20) NOT NULL,
  `room_id` bigint(20) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_cover` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_prices`
--

CREATE TABLE `room_prices` (
  `id` bigint(20) NOT NULL,
  `room_id` bigint(20) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `weekend_price` decimal(10,2) DEFAULT NULL,
  `extra_guest_price` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_prices`
--

INSERT INTO `room_prices` (`id`, `room_id`, `price`, `weekend_price`, `extra_guest_price`, `tax`) VALUES
(6, 6, 4200.00, 4800.00, 199.00, 12.00),
(7, 7, 950.00, 1150.00, 0.00, 12.00);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('TUggUotZvdqtcgafLWufqdCaUurazy1Y', 1783430423, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-07T05:42:45.921Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"vendorId\":1}'),
('reALfHQLukx2z465lq2BhdxUlugigMpW', 1783513467, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-08T12:24:26.519Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"vendorId\":3}');

-- --------------------------------------------------------

--
-- Table structure for table `states`
--

CREATE TABLE `states` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `country_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `state_code` varchar(10) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `states`
--

INSERT INTO `states` (`id`, `country_id`, `name`, `state_code`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Delhi', 'DL', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(2, 1, 'Uttar Pradesh', 'UP', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(3, 1, 'Maharashtra', 'MH', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(4, 2, 'California', 'CA', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(5, 2, 'Texas', 'TX', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(6, 3, 'Dubai', 'DU', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36'),
(7, 3, 'Abu Dhabi', 'AD', 1, '2026-06-26 10:15:36', '2026-06-26 10:15:36');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `password` varchar(255) DEFAULT NULL,
  `otp` varchar(10) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `status` enum('pending','active','blocked') DEFAULT 'pending',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `first_name`, `last_name`, `email`, `phone`, `country_code`, `password`, `otp`, `otp_expiry`, `phone_verified_at`, `email_verified_at`, `profile_image`, `business_name`, `gst_number`, `pan_number`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Rajat ', 'Yadav ', 'aryanrao9311@gmail.com', '9310155405', '+91', '$2b$10$2b3bz8hyAgtZFRkppscljezSoQl8wtGcBlwdLdopd8yaG5BCNUZMS', NULL, NULL, NULL, NULL, NULL, 'Web Loxic', NULL, NULL, 'active', NULL, NULL, NULL),
(2, 'Rajat ', 'Yadav', 'testing@gmail.com', '9876543210', '+91', '$2b$10$SzkRQx88n9fDZDGFWQzDEerlQ.YnkGgM3UdPND5mUNuvNn/j7eBY6', NULL, NULL, NULL, NULL, NULL, 'Web Loxic ', NULL, NULL, 'active', NULL, NULL, NULL),
(3, 'Raushan ', 'Kumar ', 'testing2@gmail.com', '9576486324', '+91', '$2b$10$Pe1KZDM4GC4uXhOO7v0VjeJl3gikpBkneuLbQ88Ifz9XUTuEddEDC', NULL, NULL, NULL, NULL, NULL, 'Reborn', NULL, NULL, 'active', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendor_addresses`
--

CREATE TABLE `vendor_addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vendor_id` bigint(20) UNSIGNED NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `address_line_1` varchar(255) NOT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `country_id` bigint(20) UNSIGNED NOT NULL,
  `state_id` bigint(20) UNSIGNED NOT NULL,
  `city_id` bigint(20) UNSIGNED NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendor_addresses`
--

INSERT INTO `vendor_addresses` (`id`, `vendor_id`, `business_name`, `contact_person`, `address_line_1`, `address_line_2`, `landmark`, `country_id`, `state_id`, `city_id`, `postal_code`, `latitude`, `longitude`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 2, 'Hotel Dev Palace ', 'Dev ', 'PartapBagh , Shakti Nagar ', '1 Floor , Misdon Neon', 'Partap Bagh', 1, 1, 1, '110023', NULL, NULL, 1, '2026-06-26 11:23:13', '2026-06-26 11:23:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `amenities`
--
ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_country` (`country_id`),
  ADD KEY `idx_state` (`state_id`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `iso2` (`iso2`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_type_id` (`property_type_id`);

--
-- Indexes for table `property_addresses`
--
ALTER TABLE `property_addresses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `property_id_2` (`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `amenity_id` (`amenity_id`);

--
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_listing_progress`
--
ALTER TABLE `property_listing_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `property_policies`
--
ALTER TABLE `property_policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `property_id_2` (`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_rules`
--
ALTER TABLE `property_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `property_id_2` (`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_types`
--
ALTER TABLE `property_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `room_availability`
--
ALTER TABLE `room_availability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `room_beds`
--
ALTER TABLE `room_beds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `room_dorm_beds`
--
ALTER TABLE `room_dorm_beds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `room_images`
--
ALTER TABLE `room_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `room_prices`
--
ALTER TABLE `room_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_id_2` (`room_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_country` (`country_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vendor_addresses`
--
ALTER TABLE `vendor_addresses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_id` (`vendor_id`),
  ADD KEY `idx_vendor` (`vendor_id`),
  ADD KEY `idx_country` (`country_id`),
  ADD KEY `idx_state` (`state_id`),
  ADD KEY `idx_city` (`city_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `amenities`
--
ALTER TABLE `amenities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `property_addresses`
--
ALTER TABLE `property_addresses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `property_amenities`
--
ALTER TABLE `property_amenities`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `property_listing_progress`
--
ALTER TABLE `property_listing_progress`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `property_policies`
--
ALTER TABLE `property_policies`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `property_rules`
--
ALTER TABLE `property_rules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `property_types`
--
ALTER TABLE `property_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `room_availability`
--
ALTER TABLE `room_availability`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room_beds`
--
ALTER TABLE `room_beds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `room_dorm_beds`
--
ALTER TABLE `room_dorm_beds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `room_images`
--
ALTER TABLE `room_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `room_prices`
--
ALTER TABLE `room_prices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vendor_addresses`
--
ALTER TABLE `vendor_addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `fk_cities_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cities_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`);

--
-- Constraints for table `property_addresses`
--
ALTER TABLE `property_addresses`
  ADD CONSTRAINT `property_addresses_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD CONSTRAINT `property_amenities_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `property_amenities_ibfk_2` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`);

--
-- Constraints for table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `property_listing_progress`
--
ALTER TABLE `property_listing_progress`
  ADD CONSTRAINT `property_listing_progress_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_listing_progress_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_policies`
--
ALTER TABLE `property_policies`
  ADD CONSTRAINT `property_policies_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `property_rules`
--
ALTER TABLE `property_rules`
  ADD CONSTRAINT `property_rules_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_rooms_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_availability`
--
ALTER TABLE `room_availability`
  ADD CONSTRAINT `room_availability_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_beds`
--
ALTER TABLE `room_beds`
  ADD CONSTRAINT `room_beds_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_dorm_beds`
--
ALTER TABLE `room_dorm_beds`
  ADD CONSTRAINT `fk_room_dorm_beds` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_images`
--
ALTER TABLE `room_images`
  ADD CONSTRAINT `fk_room_images` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_prices`
--
ALTER TABLE `room_prices`
  ADD CONSTRAINT `room_prices_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `states`
--
ALTER TABLE `states`
  ADD CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_addresses`
--
ALTER TABLE `vendor_addresses`
  ADD CONSTRAINT `fk_vendor_addresses_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  ADD CONSTRAINT `fk_vendor_addresses_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`),
  ADD CONSTRAINT `fk_vendor_addresses_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`),
  ADD CONSTRAINT `fk_vendor_addresses_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
