from textwrap import dedent

sql = dedent("""
-- Hotel Booking Platform Database
CREATE DATABASE IF NOT EXISTS hotel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE admins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    status ENUM('active','inactive') DEFAULT 'active',
    remember_token VARCHAR(255),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE countries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    iso_code VARCHAR(10),
    phone_code VARCHAR(10),
    status TINYINT(1) DEFAULT 1
);

CREATE TABLE states (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE cities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    state_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

CREATE TABLE vendors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    country_code VARCHAR(10) DEFAULT '+91',
    password VARCHAR(255) NOT NULL,
    otp VARCHAR(10),
    otp_expiry DATETIME,
    phone_verified_at TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    profile_image VARCHAR(255),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    country_id BIGINT UNSIGNED,
    state_id BIGINT UNSIGNED,
    city_id BIGINT UNSIGNED,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status ENUM('pending','active','blocked') DEFAULT 'pending',
    remember_token VARCHAR(255),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (state_id) REFERENCES states(id),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    country_code VARCHAR(10),
    password VARCHAR(255),
    profile_image VARCHAR(255),
    gender ENUM('male','female','other'),
    date_of_birth DATE,
    status ENUM('active','blocked') DEFAULT 'active',
    remember_token VARCHAR(255),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE hotel_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(255),
    status TINYINT(1) DEFAULT 1
);

CREATE TABLE amenities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(255),
    type ENUM('hotel','room','both') DEFAULT 'both',
    status TINYINT(1) DEFAULT 1
);

CREATE TABLE hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED,
    hotel_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    star_rating TINYINT,
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    country_id BIGINT UNSIGNED,
    state_id BIGINT UNSIGNED,
    city_id BIGINT UNSIGNED,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    check_in TIME,
    check_out TIME,
    status ENUM('active','inactive') DEFAULT 'active',
    approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (category_id) REFERENCES hotel_categories(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (state_id) REFERENCES states(id),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE hotel_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    image VARCHAR(255) NOT NULL,
    is_cover TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE hotel_amenities (
    hotel_id BIGINT UNSIGNED,
    amenity_id BIGINT UNSIGNED,
    PRIMARY KEY(hotel_id, amenity_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);

CREATE TABLE room_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    room_name VARCHAR(150),
    description TEXT,
    room_size VARCHAR(100),
    bed_type VARCHAR(100),
    max_adults INT DEFAULT 2,
    max_children INT DEFAULT 0,
    total_rooms INT DEFAULT 1,
    available_rooms INT DEFAULT 1,
    base_price DECIMAL(10,2),
    weekend_price DECIMAL(10,2),
    extra_bed_price DECIMAL(10,2),
    status ENUM('active','inactive') DEFAULT 'active',
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE room_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_type_id BIGINT UNSIGNED,
    image VARCHAR(255),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

CREATE TABLE room_amenities (
    room_type_id BIGINT UNSIGNED,
    amenity_id BIGINT UNSIGNED,
    PRIMARY KEY(room_type_id, amenity_id),
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);

CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_no VARCHAR(50) UNIQUE,
    user_id BIGINT UNSIGNED,
    hotel_id BIGINT UNSIGNED,
    room_type_id BIGINT UNSIGNED,
    check_in DATE,
    check_out DATE,
    adults INT,
    children INT,
    rooms INT,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    discount DECIMAL(10,2),
    total DECIMAL(10,2),
    booking_status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
    payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(hotel_id) REFERENCES hotels(id),
    FOREIGN KEY(room_type_id) REFERENCES room_types(id)
);

CREATE TABLE booking_guests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED,
    name VARCHAR(150),
    age INT,
    gender ENUM('male','female','other'),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED,
    transaction_id VARCHAR(150),
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
    paid_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED,
    booking_id BIGINT UNSIGNED,
    rating TINYINT,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE wishlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    hotel_id BIGINT UNSIGNED,
    UNIQUE KEY uk_wishlist(user_id, hotel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin','vendor','user'),
    user_id BIGINT UNSIGNED,
    title VARCHAR(255),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) UNIQUE,
    discount_type ENUM('percentage','fixed'),
    discount DECIMAL(10,2),
    minimum_amount DECIMAL(10,2),
    expiry_date DATE,
    status TINYINT(1) DEFAULT 1
);

SET FOREIGN_KEY_CHECKS=1;
""")

