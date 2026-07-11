-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 10, 2026 at 09:23 AM
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
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `password` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','admin','operations','finance','support') DEFAULT 'admin',
  `status` enum('active','inactive','blocked') DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(50) DEFAULT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `first_name`, `last_name`, `email`, `phone`, `country_code`, `password`, `profile_image`, `role`, `status`, `last_login_at`, `last_login_ip`, `remember_token`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Rajat', 'Yadav', 'admin@prostayz.com', '9310155405', '+91', '$2b$10$SzkRQx88n9fDZDGFWQzDEerlQ.YnkGgM3UdPND5mUNuvNn/j7eBY6', NULL, 'super_admin', 'active', '2026-07-10 06:39:21', '::1', NULL, NULL, '2026-07-04 05:45:30', '2026-07-10 06:39:21');

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
(10, '24x7 Security', 'ShieldCheck', 1),
(11, 'Ventilation', 'Wind', 1),
(12, 'security', 'Lock', 1);

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_number` varchar(30) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) NOT NULL,
  `vendor_id` bigint(20) UNSIGNED NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `nights` int(11) NOT NULL DEFAULT 1,
  `adults` int(11) NOT NULL DEFAULT 1,
  `children` int(11) NOT NULL DEFAULT 0,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `extra_guest_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'INR',
  `booking_status` enum('pending','confirmed','checked_in','checked_out','cancelled','no_show') DEFAULT 'pending',
  `payment_status` enum('pending','paid','partially_paid','refunded','failed') DEFAULT 'pending',
  `contact_name` varchar(150) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(150) DEFAULT NULL,
  `special_requests` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` enum('user','vendor','admin') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `booking_number`, `user_id`, `property_id`, `vendor_id`, `check_in_date`, `check_out_date`, `nights`, `adults`, `children`, `subtotal`, `tax_amount`, `extra_guest_amount`, `discount_amount`, `total_amount`, `currency`, `booking_status`, `payment_status`, `contact_name`, `contact_phone`, `contact_email`, `special_requests`, `cancellation_reason`, `cancelled_at`, `cancelled_by`, `created_at`, `updated_at`) VALUES
(1, 'BKMRDGX32E9OID', 1, 1, 1, '2026-07-09', '2026-07-10', 1, 2, 0, 750.00, 90.00, 0.00, 0.00, 840.00, 'INR', 'pending', 'pending', 'Anjali Rathore', '+91 98765 43210', 'testing2@gmail.com', 'Check thid', NULL, NULL, NULL, '2026-07-09 12:13:30', '2026-07-09 12:13:30'),
(2, 'BKMRDH4K71BU4W', 1, 1, 1, '2026-07-09', '2026-07-10', 1, 2, 0, 1050.00, 126.00, 0.00, 0.00, 1176.00, 'INR', 'pending', 'pending', 'Anjali Rathore', '+91 98765 43210', 'yahah', 'Jajsj', NULL, NULL, NULL, '2026-07-09 12:19:19', '2026-07-09 12:19:19');

-- --------------------------------------------------------

--
-- Table structure for table `booking_payments`
--

CREATE TABLE `booking_payments` (
  `id` bigint(20) NOT NULL,
  `booking_id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_type` enum('advance','full','refund') DEFAULT 'full',
  `payment_method` enum('card','upi','netbanking','wallet','cash') DEFAULT NULL,
  `transaction_id` varchar(150) DEFAULT NULL,
  `status` enum('initiated','success','failed','refunded') DEFAULT 'initiated',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_rooms`
--

CREATE TABLE `booking_rooms` (
  `id` bigint(20) NOT NULL,
  `booking_id` bigint(20) NOT NULL,
  `room_id` bigint(20) NOT NULL,
  `dorm_bed_id` bigint(20) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `room_price` decimal(10,2) NOT NULL,
  `extra_guest_price` decimal(10,2) DEFAULT 0.00,
  `tax` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_rooms`
--

INSERT INTO `booking_rooms` (`id`, `booking_id`, `room_id`, `dorm_bed_id`, `quantity`, `room_price`, `extra_guest_price`, `tax`, `created_at`) VALUES
(1, 1, 7, 5, 1, 750.00, 0.00, 90.00, '2026-07-09 12:13:30'),
(2, 2, 7, 6, 1, 1050.00, 0.00, 126.00, '2026-07-09 12:19:19');

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
(1, 1, 7, 'Taj Palace, New Delhi', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 950.00, 4200.00, 'approved', 0, NULL, NULL, '2026-06-30 10:12:38', '2026-07-01 12:07:43'),
(2, 1, 7, 'The Imperial, New Delhi', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, NULL, NULL, 'draft', 0, NULL, NULL, '2026-07-01 12:10:17', '2026-07-01 12:10:17'),
(3, 4, 7, 'Radisson Blu Plaza Delhi Airport', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 4200.00, 4200.00, 'approved', 0, NULL, NULL, '2026-07-03 19:09:10', '2026-07-03 19:13:29'),
(4, 2, 7, 'The LaLiT, New Delhi', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 4200.00, 4200.00, 'approved', 0, NULL, NULL, '2026-07-04 05:39:12', '2026-07-04 05:40:31'),
(5, 6, 7, 'Saffron Bagh Heritage Stay', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 4200.00, 4200.00, 'approved', 0, NULL, NULL, '2026-07-04 06:32:41', '2026-07-04 06:36:00'),
(6, 7, 7, 'The Leela Palace New Delhi', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 4200.00, 4200.00, 'approved', 0, NULL, NULL, '2026-07-04 07:07:40', '2026-07-08 11:03:59'),
(7, 8, 2, 'Splendid Sanctuary', 'saffron-bagh-heritage-stay', 'A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.', 4, 'Anjali Rathore', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '13:00:00', '11:00:00', 9, 28000.00, 28000.00, 'approved', 0, NULL, NULL, '2026-07-04 09:19:31', '2026-07-06 11:16:07'),
(8, 2, 2, 'Spiritual & Vastu-Aligned', 'spiritual-vastu-aligned', 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odit vero, sunt quia ex temporibus perspiciatis veritatis quasi a praesentium laborum consequuntur, at soluta mollitia doloribus in, nulla ratione natus minus.', 4, 'Rajat Yadav', '+91 98765 43210', 'stay@saffronbagh.com', 'www.saffronbagh.com', '11:00:00', '10:59:00', 4, 200.00, 200.00, 'approved', 0, NULL, NULL, '2026-07-10 06:42:33', '2026-07-10 06:45:58');

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
(1, 1, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(2, 3, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(3, 4, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(4, 5, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(5, 6, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(6, 7, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola'),
(7, 8, 'India', 'Rajasthan', 'Udaipur', 'Hanuman Ghat', '14 Brahmpuri Lane, near Hanuman Ghat', '313001', '200m from Lake Pichola');

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
(3, 1, 4),
(26, 3, 2),
(27, 3, 3),
(28, 3, 6),
(29, 3, 8),
(30, 3, 7),
(34, 4, 7),
(35, 4, 1),
(36, 4, 6),
(41, 5, 1),
(42, 5, 6),
(43, 6, 1),
(44, 6, 7),
(45, 6, 5),
(70, 7, 1),
(71, 7, 2),
(72, 7, 3),
(73, 7, 6),
(74, 7, 8),
(75, 7, 5),
(76, 8, 1),
(77, 8, 2),
(78, 8, 3),
(79, 8, 6),
(80, 8, 8),
(81, 8, 7),
(82, 8, 11),
(83, 8, 10);

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
(12, 1, '1782821035523-552307190.jpg', 0, 3),
(22, 3, '1783105954081-855111283.jpg', 1, 0),
(23, 3, '1783105954083-396337998.jpg', 0, 1),
(24, 3, '1783105954086-802106315.jpg', 0, 2),
(25, 4, '1783143577071-615782638.jpg', 1, 0),
(26, 4, '1783143577076-133866514.jpg', 0, 1),
(27, 4, '1783143577080-548496986.jpg', 0, 2),
(31, 5, '1783146953216-941814038.jpg', 1, 0),
(32, 5, '1783146953221-343773485.jpg', 0, 1),
(33, 6, '1783148871750-719174393.jpg', 1, 0),
(34, 6, '1783148871758-20933496.jpg', 0, 1),
(35, 6, '1783148871762-19729462.jpg', 0, 2),
(48, 7, '1783158996576-651857591.jpg', 1, 0),
(49, 7, '1783158996581-241212971.jpg', 0, 1),
(50, 7, '1783158996589-6905151.jpg', 0, 2),
(51, 8, '1783665871966-110769416.jpg', 1, 0),
(52, 8, '1783665871967-900933818.jpg', 0, 1),
(53, 8, '1783665871967-546976503.jpg', 0, 2),
(54, 8, '1783665871967-924689117.jpg', 0, 3);

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
(2, 2, 1, 2, '{\"basic_info\":true}', 15, 0, '2026-07-01 12:10:18', '2026-07-01 12:10:18', '2026-07-01 12:10:18'),
(3, 3, 4, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-03 19:13:29', '2026-07-03 19:09:10', '2026-07-03 19:13:29'),
(4, 4, 2, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-04 05:40:31', '2026-07-04 05:39:12', '2026-07-04 05:40:31'),
(5, 5, 6, 7, '{\"basic_info\": true, \"location\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true, \"photos\": true}', 100, 1, '2026-07-04 06:36:00', '2026-07-04 06:32:41', '2026-07-04 06:36:00'),
(6, 6, 7, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-04 07:08:31', '2026-07-04 07:07:40', '2026-07-04 07:08:31'),
(7, 7, 8, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-04 10:09:41', '2026-07-04 09:19:31', '2026-07-04 10:09:41'),
(8, 8, 2, 7, '{\"basic_info\": true, \"location\": true, \"photos\": true, \"amenities\": true, \"policies\": true, \"rules\": true, \"rooms\": true}', 100, 1, '2026-07-10 06:45:20', '2026-07-10 06:42:33', '2026-07-10 06:45:20');

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
(1, 1, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(2, 3, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(3, 4, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(4, 5, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(5, 6, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(6, 7, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.'),
(7, 8, 'Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.', 'Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.', 'Refunds are processed to the original payment method within 5–7 business days.');

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
(1, 1, 1, 0, 0, 1, 1),
(2, 3, 1, 0, 0, 1, 1),
(3, 4, 0, 0, 0, 1, 1),
(4, 5, 0, 0, 0, 1, 1),
(5, 6, 0, 0, 0, 1, 1),
(6, 7, 0, 0, 0, 1, 1),
(7, 8, 0, 0, 0, 1, 1);

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
(7, 1, 'Backpacker Mixed Dorm', 'Dormitory', 'dorm', 1, 0, 1, 1, 360, 'sqft', 0, 0, 1, NULL),
(8, 3, 'Heritage Garden Room', 'Deluxe', 'private', 2, 1, 6, 4, 280, 'sqft', 1, 0, 1, NULL),
(10, 4, 'Heritage Garden Room', 'Deluxe', 'private', 2, 1, 6, 4, 280, 'sqft', 1, 0, 1, NULL),
(13, 5, 'Heritage Garden Room', 'Deluxe', 'private', 2, 1, 6, 4, 280, 'sqft', 1, 0, 1, NULL),
(14, 6, 'Heritage Garden Room', 'Deluxe', 'private', 2, 1, 6, 4, 280, 'sqft', 1, 0, 1, NULL),
(15, 7, 'Entire Saffron Bagh Villa', 'Gues ', 'private', 10, 4, 1, 1, 3200, 'sqft', 0, 1, 1, NULL),
(16, 8, 'Heritage Garden Room', 'Deluxe', 'whole_property', 2, 1, 6, 4, 280, 'sqft', 1, 0, 1, NULL);

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
(6, 6, 'Queen Bed', 1),
(7, 8, 'Queen Bed', 1),
(9, 10, 'Queen Bed', 1),
(12, 13, 'Queen Bed', 1),
(13, 14, 'Queen Bed', 1),
(14, 15, 'Single Bed', 2),
(15, 15, 'Single Bed', 1),
(16, 16, 'Queen Bed', 1);

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
(5, 7, 'Bunk A - Top', 'Bunk - Top', 'blocked', 750.00),
(6, 7, 'Bunk A - Bottom', 'Bunk - Bottom', 'blocked', 1050.00),
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

--
-- Dumping data for table `room_images`
--

INSERT INTO `room_images` (`id`, `room_id`, `image`, `is_cover`, `sort_order`) VALUES
(9, 8, '1783106004905-735984812.jpg', 1, 0),
(13, 14, '1783148910627-493518530.jpg', 1, 0),
(14, 16, '1783665918972-415135389.jpg', 1, 0),
(15, 16, '1783665918972-90631911.jpg', 0, 1),
(16, 16, '1783665918972-517477867.jpg', 0, 2);

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
(7, 7, 950.00, 1150.00, 0.00, 12.00),
(8, 8, 4200.00, 4800.00, 600.00, 12.00),
(10, 10, 4200.00, 4800.00, 600.00, 12.00),
(13, 13, 4200.00, 4800.00, 600.00, 12.00),
(14, 14, 4200.00, 4800.00, 600.00, 12.00),
(15, 15, 28000.00, 34000.00, 1500.00, 18.00),
(16, 16, 200.00, 2001.00, 600.00, 12.00);

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
('EuhQTbO9ejrKsxipqNtSZvxkp7WAagBr', 1784272875, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-17T06:39:21.528Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"adminId\":1}'),
('F6hZyDDQD9-7PaBtXv7RjbQHfhBO_WWw', 1784272894, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-17T07:19:53.042Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"vendorId\":1}'),
('ZK_SOEyNcRGvNZBD4aBUaDIVD1-DbEkZ', 1783941176, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-13T11:12:53.000Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"vendorId\":2}'),
('iWxS3xnsvjD-eMM0wbHni_6GPR7ToyNT', 1783791951, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-07-11T09:15:27.234Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"vendorId\":8}');

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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `password` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `apple_id` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `phone_verified` tinyint(1) DEFAULT 0,
  `status` enum('active','blocked') DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `country_code`, `password`, `profile_image`, `gender`, `date_of_birth`, `google_id`, `apple_id`, `email_verified`, `phone_verified`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Rajat Yadav', NULL, 'testing3@gmail.com', '9310155405', '+91', '$2b$10$jATx9lWIotHgLnJNhOaqH.WgEvqAoYHwFiR3okHLr.EF/DYhVuqtm', NULL, NULL, NULL, NULL, NULL, 0, 0, 'active', '2026-07-09 17:40:14', '2026-07-08 06:51:36', '2026-07-09 12:10:14');

-- --------------------------------------------------------

--
-- Table structure for table `user_refresh_tokens`
--

CREATE TABLE `user_refresh_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `refresh_token` text NOT NULL,
  `device_type` enum('android','ios') NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_refresh_tokens`
--

INSERT INTO `user_refresh_tokens` (`id`, `user_id`, `refresh_token`, `device_type`, `device_name`, `device_id`, `expires_at`, `created_at`) VALUES
(1, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDkzNDk2LCJleHAiOjE3ODYwODU0OTZ9.2vmuEzx7IOo9_GhRE2AfIGVMJLHTqwX6Y26VtYW7YzY', 'android', NULL, NULL, '2026-08-07 12:21:36', '2026-07-08 06:51:36'),
(2, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk1MTQ3LCJleHAiOjE3ODYwODcxNDd9.B2yzP_vGgIHbks8vnwm17QnmAoWk7p6EJf92RpbBVCU', 'android', NULL, NULL, '2026-08-07 12:49:07', '2026-07-08 07:19:07'),
(3, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk1MTUxLCJleHAiOjE3ODYwODcxNTF9.12Ba2PraDxqRscfgt8YBy96DaMoc3ywokzPQmsilxIk', 'android', NULL, NULL, '2026-08-07 12:49:11', '2026-07-08 07:19:11'),
(4, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk1MjA4LCJleHAiOjE3ODYwODcyMDh9.Nkx9WzzTHrhkWYw8Y3bVl16cjNRs8cF7wHZO-6q8Jx4', 'android', NULL, NULL, '2026-08-07 12:50:08', '2026-07-08 07:20:08'),
(5, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk1MjkwLCJleHAiOjE3ODYwODcyOTB9.stBYGjSU6RDZrHAE4_yNYvXP7yBT2AWKAhrzuh8FMqw', 'android', NULL, NULL, '2026-08-07 12:51:30', '2026-07-08 07:21:30'),
(6, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk3ODI1LCJleHAiOjE3ODYwODk4MjV9.WuRCRWyWp766foCwi9aAaz4Gu9qFWLlPyW4cEkzAUNU', 'android', NULL, NULL, '2026-08-07 13:33:45', '2026-07-08 08:03:45'),
(7, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk3ODgyLCJleHAiOjE3ODYwODk4ODJ9.dWmDi3-Exwv_xKEhELmGxhm5xmKOxqz2v49ZPn2Pev4', 'android', NULL, NULL, '2026-08-07 13:34:42', '2026-07-08 08:04:42'),
(8, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk3OTUxLCJleHAiOjE3ODYwODk5NTF9.0kbxVqICEoB9Oq0nhzftob_MgkDt9KX6qE3BZQTspOA', 'android', NULL, NULL, '2026-08-07 13:35:51', '2026-07-08 08:05:51'),
(9, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk4MTQ1LCJleHAiOjE3ODYwOTAxNDV9.eA8vNYXW1g00h9l1GnI7-Frvk0qGGO0pyRUnG3FBza8', 'android', NULL, NULL, '2026-08-07 13:39:05', '2026-07-08 08:09:05'),
(10, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk4Nzg4LCJleHAiOjE3ODYwOTA3ODh9.6XyspBWfwo2w1SeGQM7PxCa5mgnlzT-jmeV7xcHbfrM', 'android', NULL, NULL, '2026-08-07 13:49:48', '2026-07-08 08:19:48'),
(11, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDk4ODU4LCJleHAiOjE3ODYwOTA4NTh9.8pLZMp6chCf_tzFvLNIEKiKbEyduwm5sZtlcWLIxCT4', 'android', NULL, NULL, '2026-08-07 13:50:58', '2026-07-08 08:20:58'),
(12, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTAxMTUyLCJleHAiOjE3ODYwOTMxNTJ9.06oeOnbIbb74Sa4l27YTh4r0hZoxlQxLt7MUpm5CEF0', 'android', NULL, NULL, '2026-08-07 14:29:12', '2026-07-08 08:59:12'),
(13, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTAyOTA5LCJleHAiOjE3ODYwOTQ5MDl9.QC3mpPl55PmYzVjsIx-kQOepsJOG8xE_Bvwfgrn6yQM', 'android', NULL, NULL, '2026-08-07 14:58:29', '2026-07-08 09:28:29'),
(14, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTA5OTQ2LCJleHAiOjE3ODYxMDE5NDZ9.oFOF2_XcjRJsvfZHJUSDLDWSfEsVNe2yHGNyMkxWwag', 'android', NULL, NULL, '2026-08-07 16:55:46', '2026-07-08 11:25:46'),
(15, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTc4ODc0LCJleHAiOjE3ODYxNzA4NzR9.3Aq_c78ln8d5Fo62EP7bNPbGTHgRe3OTMWpbwykkmqw', 'android', NULL, NULL, '2026-08-08 12:04:34', '2026-07-09 06:34:34'),
(16, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTk2MTQ3LCJleHAiOjE3ODYxODgxNDd9.iJFTGneLRLlEOICPeeL1sDQhjr4ph7WvB5Hyio_kde0', 'android', NULL, NULL, '2026-08-08 16:52:27', '2026-07-09 11:22:27'),
(17, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNTk5MDE0LCJleHAiOjE3ODYxOTEwMTR9.pfZdVZz5qQXqJGclwDj5tbas9O1-fydWpJekUiMM360', 'android', NULL, NULL, '2026-08-08 17:40:14', '2026-07-09 12:10:14');

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
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `first_name`, `last_name`, `email`, `phone`, `country_code`, `password`, `otp`, `otp_expiry`, `phone_verified_at`, `email_verified_at`, `profile_image`, `business_name`, `gst_number`, `pan_number`, `status`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Rajat ', 'Yadav ', 'aryanrao9311@gmail.com', '9310155405', '+91', '$2b$10$2b3bz8hyAgtZFRkppscljezSoQl8wtGcBlwdLdopd8yaG5BCNUZMS', NULL, NULL, NULL, NULL, NULL, 'Web Loxic', NULL, NULL, 'active', '2026-07-10 07:19:53', NULL, NULL, NULL),
(2, 'Rajat ', 'Yadav', 'testing@gmail.com', '9876543210', '+91', '$2b$10$SzkRQx88n9fDZDGFWQzDEerlQ.YnkGgM3UdPND5mUNuvNn/j7eBY6', NULL, NULL, NULL, NULL, NULL, 'Web Loxic ', NULL, NULL, 'active', '2026-07-10 06:28:28', NULL, NULL, NULL),
(3, 'Raushan ', 'Kumar ', 'testing2@gmail.com', '9576486324', '+91', '$2b$10$Pe1KZDM4GC4uXhOO7v0VjeJl3gikpBkneuLbQ88Ifz9XUTuEddEDC', NULL, NULL, NULL, NULL, NULL, 'Reborn', NULL, NULL, 'active', NULL, NULL, NULL, NULL),
(4, 'Testing ', '5', 'testingBussiness@gmail.com', '9314578457', '+91', '$2b$10$ZBlxB5BTyn8TVOaNwpatqu53ZnKXPvrHObXgrS3dQyDe6p/KlOLdm', NULL, NULL, NULL, NULL, NULL, 'Testing Business Name ', NULL, NULL, 'active', NULL, NULL, NULL, NULL),
(5, 'Testing 6', 'last ', 'testing6@gmail.com', '9134575785', '+91', '$2b$10$5eCl57EFSweFbsWT.fGPAeHONZXNT4Oqy8nk08LNJ2owEmSIeJXbq', NULL, NULL, NULL, NULL, NULL, 'testing 6 business', NULL, NULL, 'active', NULL, NULL, NULL, NULL),
(6, 'Testing 6', 'last ', 'testing7@gmail.com', '9134578587', '+91', '$2b$10$U1f7zjmCXxikMqdYFNvyNOMcc6ypROgfVnUsBBuGaVponUTDjoXJ.', NULL, NULL, NULL, NULL, NULL, 'testing 6 business', NULL, NULL, 'active', NULL, NULL, NULL, NULL),
(7, 'Testing', '8', 'testing8@gmail.com', '9142457854', '+91', '$2b$10$0jKeyN4m9yTj.EN0MNh/EuiCCriwETNyHkJOvQ3ypx0lq8bUcala6', NULL, NULL, NULL, NULL, NULL, 'testing 8 Business', NULL, NULL, 'active', NULL, NULL, NULL, NULL),
(8, 'TEsting ', ' 9', 'testing9@gmail.com', '9124757854', '+91', '$2b$10$pdzNW/yo80DLSZ3Fs7q/xe5W5PiuTHVsFUrtb6UDEkjjKwEzvdmYq', NULL, NULL, NULL, NULL, NULL, 'Testing Business ', NULL, NULL, 'blocked', NULL, NULL, NULL, '2026-07-06 10:27:27');

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
(1, 2, 'Hotel Dev Palace ', 'Dev ', 'PartapBagh , Shakti Nagar ', '1 Floor , Misdon Neon', 'Partap Bagh', 1, 1, 1, '110023', NULL, NULL, 1, '2026-06-26 11:23:13', '2026-06-26 11:23:13'),
(2, 4, 'Dev Palace ', 'Rajat Yaadav ', 'UA-31 , Block , Jawahar Nagar , Kamla Nagar', '1 floor ', 'Near Momos Point', 1, 1, 1, '110001', NULL, NULL, 1, '2026-07-03 19:08:54', '2026-07-03 19:08:54'),
(3, 6, 'Dev Palace ', 'Rajat Yadav', 'jawahar nagar 5465 Gali No 6 New Chandrawal Kamla Nagar', 'Kamla Nagar Jawahar Nagar', 'Near Monestry', 1, 1, 1, '110007', NULL, NULL, 1, '2026-07-04 06:32:34', '2026-07-04 06:32:34'),
(4, 7, 'Dev Palace ', 'Rajat Yadav', 'jawahar nagar 5465 Gali No 6 New Chandrawal Kamla Nagar', 'Kamla Nagar Jawahar Nagar', 'Shiv Mandir', 1, 1, 1, '110007', NULL, NULL, 1, '2026-07-04 07:07:33', '2026-07-04 07:07:33'),
(5, 8, 'Dev Palace ', 'Rajat Yadav', '5465/6 New Chandrawal', 'Kamla Nagar Jawahar Nagar', 'Near Shiv Mandir ', 1, 1, 1, '110007', NULL, NULL, 1, '2026-07-04 09:17:22', '2026-07-04 09:17:22'),
(6, 1, 'webloxic', 'RAUSHAN KUMAR', 'new delhi', 'azadpur', 'Aksh cinema', 1, 1, 1, '110033', NULL, NULL, 1, '2026-07-10 07:21:30', '2026-07-10 07:21:30');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `fk_admin_created_by` (`created_by`);

--
-- Indexes for table `amenities`
--
ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_number` (`booking_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `idx_dates` (`check_in_date`,`check_out_date`),
  ADD KEY `idx_status` (`booking_status`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Indexes for table `booking_payments`
--
ALTER TABLE `booking_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `booking_rooms`
--
ALTER TABLE `booking_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `dorm_bed_id` (`dorm_bed_id`);

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
  ADD UNIQUE KEY `uniq_room_date` (`room_id`,`available_date`),
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
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_property_unique` (`user_id`,`property_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `property_id` (`property_id`);
--
-- AUTO_INCREMENT for dumped tables
--
--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `amenities`
--
ALTER TABLE `amenities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `booking_payments`
--
ALTER TABLE `booking_payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `booking_rooms`
--
ALTER TABLE `booking_rooms`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `property_addresses`
--
ALTER TABLE `property_addresses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `property_amenities`
--
ALTER TABLE `property_amenities`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;
--
-- AUTO_INCREMENT for table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `property_listing_progress`
--
ALTER TABLE `property_listing_progress`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `property_policies`
--
ALTER TABLE `property_policies`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `property_rules`
--
ALTER TABLE `property_rules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `property_types`
--
ALTER TABLE `property_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `room_availability`
--
ALTER TABLE `room_availability`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `room_beds`
--
ALTER TABLE `room_beds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `room_dorm_beds`
--
ALTER TABLE `room_dorm_beds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `room_images`
--
ALTER TABLE `room_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `room_prices`
--
ALTER TABLE `room_prices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `vendor_addresses`
--
ALTER TABLE `vendor_addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- Constraints for dumped tables
--
--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `fk_admin_created_by` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;
--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`);
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
-- Constraints for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD CONSTRAINT `user_refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
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