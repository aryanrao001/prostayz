-- ============================================================
-- Migration: Vendor Document Verification + Review Enhancements
-- Run this against the existing prostayz database.
-- Safe to re-run: every statement checks for existence first.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Vendor document verification
-- ------------------------------------------------------------
-- The old DocumentController referenced a `property_documents` table
-- that was never created, so vendor document upload has been silently
-- broken (every request 500'd on the INSERT). This creates it properly
-- and ties documents to a vendor (KYC docs) with an optional property
-- link (e.g. ownership proof for a specific listing).

CREATE TABLE IF NOT EXISTS `property_documents` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `vendor_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_type` enum(
    'business_registration',
    'ownership_proof',
    'ubo',
    'pan_card',
    'gst_certificate',
    'government_id'
  ) NOT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_vendor_property_doctype` (`vendor_id`, `property_id`, `document_type`),
  KEY `idx_property_documents_vendor` (`vendor_id`),
  KEY `idx_property_documents_property` (`property_id`),
  KEY `idx_property_documents_status` (`status`),
  CONSTRAINT `fk_docs_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_docs_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Vendor-level verification status, driven by whether their required KYC
-- documents (business_registration, pan_card, gst_certificate, government_id)
-- have all been verified by an admin.
ALTER TABLE `vendors`
  ADD COLUMN IF NOT EXISTS `verification_status` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `verification_notes` varchar(500) DEFAULT NULL AFTER `verification_status`,
  ADD COLUMN IF NOT EXISTS `verified_at` timestamp NULL DEFAULT NULL AFTER `verification_notes`;

-- ------------------------------------------------------------
-- 2. Review system enhancements
-- ------------------------------------------------------------
-- Let a vendor publicly reply to a guest review (Airbnb/Booking.com style).
ALTER TABLE `property_reviews`
  ADD COLUMN IF NOT EXISTS `vendor_reply` text DEFAULT NULL AFTER `review`,
  ADD COLUMN IF NOT EXISTS `vendor_reply_at` timestamp NULL DEFAULT NULL AFTER `vendor_reply`;

-- Per-category ratings (cleanliness, accuracy, value, etc.) — optional,
-- lets the details page show an Airbnb-style ratings breakdown later.
ALTER TABLE `property_reviews`
  ADD COLUMN IF NOT EXISTS `cleanliness_rating` tinyint DEFAULT NULL AFTER `rating`,
  ADD COLUMN IF NOT EXISTS `accuracy_rating` tinyint DEFAULT NULL AFTER `cleanliness_rating`,
  ADD COLUMN IF NOT EXISTS `value_rating` tinyint DEFAULT NULL AFTER `accuracy_rating`;

-- Reviews were never indexed by property/status, so the property page
-- query (WHERE property_id = ? AND status = 'approved' ORDER BY created_at)
-- would do a full table scan once review volume grows.
ALTER TABLE `property_reviews`
  ADD INDEX IF NOT EXISTS `idx_reviews_property_status` (`property_id`, `status`),
  ADD INDEX IF NOT EXISTS `idx_reviews_user` (`user_id`);

-- ------------------------------------------------------------
-- 3. Booking system indexes
-- ------------------------------------------------------------
-- getVendorBookings / getUserBookings / availability checks all filter on
-- these columns with no supporting index today.
ALTER TABLE `bookings`
  ADD INDEX IF NOT EXISTS `idx_bookings_vendor_status` (`vendor_id`, `booking_status`),
  ADD INDEX IF NOT EXISTS `idx_bookings_user` (`user_id`),
  ADD INDEX IF NOT EXISTS `idx_bookings_property_dates` (`property_id`, `check_in_date`, `check_out_date`);

-- ------------------------------------------------------------
-- 4. Data integrity fix: duplicate property slugs
-- ------------------------------------------------------------
-- The current data has multiple properties sharing the same slug
-- (e.g. 'saffron-bagh-heritage-stay' used by 6 different properties),
-- which breaks slug-based routing (/property/:slug always resolves to
-- whichever row MySQL returns first). This de-duplicates existing slugs
-- by suffixing with the property id, then makes slug unique going forward.
UPDATE `properties` p
JOIN (
  SELECT id, slug,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM `properties`
) ranked ON ranked.id = p.id
SET p.slug = CONCAT(p.slug, '-', p.id)
WHERE ranked.rn > 1;

ALTER TABLE `properties`
  ADD UNIQUE KEY IF NOT EXISTS `uniq_properties_slug` (`slug`);
