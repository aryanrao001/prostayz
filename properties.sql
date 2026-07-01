CREATE TABLE property_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(255) DEFAULT NULL,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE properties (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    vendor_id BIGINT NOT NULL,

    property_type_id INT NOT NULL,

    property_name VARCHAR(255),

    slug VARCHAR(255),

    description LONGTEXT,

    star_rating TINYINT DEFAULT 0,

    contact_name VARCHAR(150),

    contact_number VARCHAR(20),

    email VARCHAR(150),

    website VARCHAR(255),

    check_in TIME,

    check_out TIME,

    total_rooms INT DEFAULT 0,

    min_price DECIMAL(10,2),

    max_price DECIMAL(10,2),

    status ENUM('draft','pending','approved','rejected') DEFAULT 'draft',

    is_featured TINYINT(1) DEFAULT 0,

    latitude DECIMAL(10,8),

    longitude DECIMAL(11,8),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(property_type_id)
    REFERENCES property_types(id)

);


CREATE TABLE property_addresses (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    country VARCHAR(100),

    state VARCHAR(100),

    city VARCHAR(100),

    area VARCHAR(100),

    address TEXT,

    pincode VARCHAR(20),

    landmark VARCHAR(255),

    FOREIGN KEY(property_id)
    REFERENCES properties(id)

);


CREATE TABLE property_images (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    image VARCHAR(255),

    is_cover TINYINT(1) DEFAULT 0,

    sort_order INT DEFAULT 0,

    FOREIGN KEY(property_id)
    REFERENCES properties(id)

);

CREATE TABLE amenities (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    icon VARCHAR(255),

    status TINYINT DEFAULT 1

);

CREATE TABLE property_amenities (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    amenity_id INT,

    FOREIGN KEY(property_id)
    REFERENCES properties(id),

    FOREIGN KEY(amenity_id)
    REFERENCES amenities(id)

);

CREATE TABLE property_policies (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    cancellation_policy LONGTEXT,

    house_rules LONGTEXT,

    refund_policy LONGTEXT,

    FOREIGN KEY(property_id)
    REFERENCES properties(id)

);


CREATE TABLE property_rules (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    smoking_allowed BOOLEAN,

    pets_allowed BOOLEAN,

    parties_allowed BOOLEAN,

    couples_allowed BOOLEAN,

    children_allowed BOOLEAN,

    FOREIGN KEY(property_id)
    REFERENCES properties(id)

);


CREATE TABLE rooms (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT,

    room_name VARCHAR(255),

    room_type VARCHAR(150),

    max_adults INT,

    max_children INT,

    total_rooms INT,

    available_rooms INT,

    room_size INT,

    room_size_unit ENUM('sqft','sqm'),

    private_bathroom BOOLEAN,

    balcony BOOLEAN,

    air_conditioning BOOLEAN,

    description TEXT,

    FOREIGN KEY(property_id)
    REFERENCES properties(id)

);


CREATE TABLE room_images (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    room_id BIGINT,

    image VARCHAR(255),

    FOREIGN KEY(room_id)
    REFERENCES rooms(id)

);

CREATE TABLE room_beds (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    room_id BIGINT,

    bed_type VARCHAR(100),

    quantity INT,

    FOREIGN KEY(room_id)
    REFERENCES rooms(id)

);


CREATE TABLE room_prices (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    room_id BIGINT,

    price DECIMAL(10,2),

    weekend_price DECIMAL(10,2),

    extra_guest_price DECIMAL(10,2),

    tax DECIMAL(10,2),

    FOREIGN KEY(room_id)
    REFERENCES rooms(id)

);

CREATE TABLE room_availability (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    room_id BIGINT,

    available_date DATE,

    available_rooms INT,

    blocked_rooms INT DEFAULT 0,

    special_price DECIMAL(10,2),

    FOREIGN KEY(room_id)
    REFERENCES rooms(id)

);



CREATE TABLE room_dorm_beds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT,
    bed_label VARCHAR(50),       -- "Bed 1", "Top Bunk A", etc
    bed_type VARCHAR(100),       -- "Bunk - Top", "Bunk - Bottom"
    status ENUM('available','blocked','maintenance') DEFAULT 'available',
    price DECIMAL(10,2),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
);