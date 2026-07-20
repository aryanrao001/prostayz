// import pool from "../../config/db.js";
// import { deleteOldRooms, saveCompleteRoom, updateListingProgress, updatePropertyPriceRange, validateRooms } from "../../services/rooms.service.js";

// export const getIncompleteListing = async (req, res) => {
//     try {
//         const vendorId = req.vendor.id;
//         const [progressRows] = await pool.execute(
//             `
//             SELECT *
//             FROM property_listing_progress
//             WHERE vendor_id=?
//             AND is_completed=0
//             ORDER BY updated_at DESC
//             LIMIT 1
//             `,
//             [vendorId]
//         );
//         if (progressRows.length === 0) {
//             return res.json({
//                 success: true,
//                 hasListing: false,
//                 message: "No incomplete listing found."
//             });
//         }
//         const progress = progressRows[0];
//         const propertyId = progress.property_id;

//         // Property
//         const [property] = await pool.execute(
//             `SELECT * FROM properties WHERE id=?`,
//             [propertyId]
//         );
//         // Address
//         const [address] = await pool.execute(
//             `SELECT * FROM property_addresses WHERE property_id=?`,
//             [propertyId]
//         );
//         // Images
//         const [images] = await pool.execute(
//             `SELECT * FROM property_images WHERE property_id=? ORDER BY sort_order ASC`,
//             [propertyId]
//         );
//         // Amenities
//         const [amenities] = await pool.execute(
//             `SELECT amenity_id FROM property_amenities WHERE property_id=?`,
//             [propertyId]
//         );
//         // Policies
//         const [policies] = await pool.execute(
//             `SELECT * FROM property_policies WHERE property_id=?`,
//             [propertyId]
//         );
//         // Rules
//         const [rules] = await pool.execute(
//             `SELECT * FROM property_rules WHERE property_id=?`,
//             [propertyId]
//         );

//         // Rooms (base rows + price)
//         const [roomRows] = await pool.execute(
//             `
//             SELECT r.*, rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax
//             FROM rooms r
//             LEFT JOIN room_prices rp ON rp.room_id = r.id
//             WHERE r.property_id = ?
//             ORDER BY r.id ASC
//             `,
//             [propertyId]
//         );

//         let rooms = [];

//         if (roomRows.length > 0) {
//             const roomIds = roomRows.map((r) => r.id);
//             const placeholders = roomIds.map(() => "?").join(",");

//             const [beds] = await pool.query(
//                 `SELECT * FROM room_beds WHERE room_id IN (${placeholders})`,
//                 roomIds
//             );
//             const [dormBeds] = await pool.query(
//                 `SELECT * FROM room_dorm_beds WHERE room_id IN (${placeholders})`,
//                 roomIds
//             );
//             const [roomImages] = await pool.query(
//                 `SELECT * FROM room_images WHERE room_id IN (${placeholders}) ORDER BY sort_order ASC`,
//                 roomIds
//             );

//             rooms = roomRows.map((room) => ({
//                 ...room,
//                 beds: beds.filter((b) => b.room_id === room.id),
//                 dorm_beds: dormBeds.filter((b) => b.room_id === room.id),
//                 images: roomImages.filter((i) => i.room_id === room.id)
//             }));
//         }

//         return res.json({
//             success: true,
//             hasListing: true,
//             property_id: propertyId,
//             current_step: progress.current_step,
//             progress: progress,
//             property: property[0] || null,
//             address: address[0] || null,
//             images,
//             amenities,
//             policies: policies[0] || null,
//             rules: rules[0] || null,
//             rooms
//         });
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// export const saveBasicInformation = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {

//         await connection.beginTransaction();
//         const vendor_id = req.vendor.id
//                 // const vendorId = req.vendor.id;


//         const {
//             property_id,
//             property_type_id,
//             property_name,
//             description,
//             star_rating,
//             contact_name,
//             contact_number,
//             email,
//             website,
//             check_in,
//             check_out,
//             total_rooms
//         } = req.body;

//         if (!vendor_id || !property_type_id || !property_name) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Vendor, Property Type and Property Name are required."
//             });
//         }
//         let propertyId = property_id;
//         // ==========================================
//         // CREATE PROPERTY
//         // =========================================
//         if (!propertyId) {
//             const slug = property_name
//                 .toLowerCase()
//                 .replace(/[^a-z0-9]+/g, "-")
//                 .replace(/(^-|-$)/g, "");
//             const [propertyResult] = await connection.execute(
//                 `
//                 INSERT INTO properties
//                 (
//                     vendor_id,
//                     property_type_id,
//                     property_name,
//                     slug,
//                     description,
//                     star_rating,
//                     contact_name,
//                     contact_number,
//                     email,
//                     website,
//                     check_in,
//                     check_out,
//                     total_rooms,
//                     status,
//                     created_at,
//                     updated_at
//                 )
//                 VALUES
//                 (
//                     ?,?,?,?,?,?,?,?,?,?,?,?,?,?,
//                     NOW(),
//                     NOW()
//                 )
//                 `,
//                 [
//                     vendor_id,
//                     property_type_id,
//                     property_name,
//                     slug,
//                     description ?? null,
//                     star_rating ?? 0,
//                     contact_name ?? null,
//                     contact_number ?? null,
//                     email ?? null,
//                     website ?? null,
//                     check_in ?? null,
//                     check_out ?? null,
//                     total_rooms ?? 0,
//                     "draft"
//                 ]
//             );
//             propertyId = propertyResult.insertId;
//             await connection.execute(
//                 `
//                 INSERT INTO property_listing_progress
//                 (
//                     property_id,
//                     vendor_id,
//                     current_step,
//                     progress,
//                     completed_percentage,
//                     is_completed,
//                     last_saved_at,
//                     created_at,
//                     updated_at
//                 )
//                 VALUES
//                 (
//                     ?,
//                     ?,
//                     ?,
//                     ?,
//                     ?,
//                     ?,
//                     NOW(),
//                     NOW(),
//                     NOW()
//                 )
//                 `,
//                 [
//                     propertyId,
//                     vendor_id,
//                     2,
//                     JSON.stringify({
//                         basic_info: true
//                     }),
//                     15,
//                     0
//                 ]
//             );
//         }
//         // ==========================================
//         // UPDATE PROPERTY
//         // ==========================================
//         else {
//             const slug = property_name
//                 .toLowerCase()
//                 .replace(/[^a-z0-9]+/g, "-")
//                 .replace(/(^-|-$)/g, "");
//             await connection.execute(
//                 `
//                 UPDATE properties
//                 SET
//                     property_type_id=?,
//                     property_name=?,
//                     slug=?,
//                     description=?,
//                     star_rating=?,
//                     contact_name=?,
//                     contact_number=?,
//                     email=?,
//                     website=?,
//                     check_in=?,
//                     check_out=?,
//                     total_rooms=?,
//                     updated_at=NOW()

//                 WHERE id=?
//                 `,
//                 [
//                     property_type_id,
//                     property_name,
//                     slug,
//                     description ?? null,
//                     star_rating ?? 0,
//                     contact_name ?? null,
//                     contact_number ?? null,
//                     email ?? null,
//                     website ?? null,
//                     check_in ?? null,
//                     check_out ?? null,
//                     total_rooms ?? 0,
//                     propertyId
//                 ]
//             );
//             await connection.execute(
//                 `
//                 UPDATE property_listing_progress
//                 SET
//                     current_step=?,
//                     progress=?,
//                     completed_percentage=?,
//                     last_saved_at=NOW(),
//                     updated_at=NOW()
//                 WHERE property_id=?
//                 `,
//                 [
//                     2,
//                     JSON.stringify({
//                         basic_info: true
//                     }),
//                     15,
//                     propertyId
//                 ]
//             );
//         }
//         await connection.commit();
//         return res.status(200).json({
//             success: true,
//             property_id: propertyId,
//             current_step: 2,
//             message: "Basic information saved successfully."
//         });
//     } catch (error) {
//         console.log(error);
//         await connection.rollback();
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };


// export const saveLocation = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const {
//             property_id,
//             country,
//             state,
//             city,
//             area,
//             address,
//             pincode,
//             landmark
//         } = req.body;
//         if (!property_id) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Property ID is required."
//             });
//         }
//         // Check if location already exists
//         const [existing] = await connection.execute(
//             `SELECT id FROM property_addresses WHERE property_id = ?`,
//             [property_id]
//         );
//         if (existing.length > 0) {
//             // Update Location
//             await connection.execute(
//                 `UPDATE property_addresses
//                  SET
//                     country=?,
//                     state=?,
//                     city=?,
//                     area=?,
//                     address=?,
//                     pincode=?,
//                     landmark=?
//                  WHERE property_id=?`,

//                 [
//                     country ?? null,
//                     state ?? null,
//                     city ?? null,
//                     area ?? null,
//                     address ?? null,
//                     pincode ?? null,
//                     landmark ?? null,
//                     property_id
//                 ]
//             );

//         } else {
//             // Insert Location
//             await connection.execute(
//                 `INSERT INTO property_addresses
//                 (
//                     property_id,
//                     country,
//                     state,
//                     city,
//                     area,
//                     address,
//                     pincode,
//                     landmark
//                 )
//                 VALUES
//                 (
//                     ?,?,?,?,?,?,?,?
//                 )`,

//                 [
//                     property_id,
//                     country ?? null,
//                     state ?? null,
//                     city ?? null,
//                     area ?? null,
//                     address ?? null,
//                     pincode ?? null,
//                     landmark ?? null
//                 ]
//             );
//         }
//         // Update Progress
//         await connection.execute(
//             `UPDATE property_listing_progress
//             SET
//                 current_step = ?,
//                 completed_percentage = ?,
//                 progress = JSON_SET(
//                     progress,
//                     '$.location',
//                   true
//                 ),
//                 last_saved_at = NOW(),
//                 updated_at = NOW()
//             WHERE property_id = ?`,
//             [
//                 3,
//                 30,
//                 property_id
//             ]
//         );
//         await connection.commit();
//         return res.status(200).json({
//             success: true,
//             current_step: 3,
//             message: "Location saved successfully."
//         });
//     } catch (error) {
//         await connection.rollback();
//         return res.status(500).json({

//             success: false,

//             message: error.message

//         });
//     } finally {
//         connection.release();
//     }
// };







// export const savePropertyImages = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();
//         console.log(req.body)
//         const { property_id } = req.body;
//         if (!property_id) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Property ID is required."
//             });
//         }
//         if (!req.files || req.files.length === 0) {
//             return res.status(422).json({
//                 success: false,
//                 message: "Please upload at least one image."
//             });
//         }
//         // Delete previous images
//         await connection.execute(
//             `DELETE FROM property_images
//              WHERE property_id=?`,
//             [property_id]
//         );
//         for (let i = 0; i < req.files.length; i++) {
//             const image = req.files[i];
//             await connection.execute(
//                 `INSERT INTO property_images
//                 (
//                     property_id,
//                     image,
//                     is_cover,
//                     sort_order
//                 )
//                 VALUES
//                 (
//                     ?,?,?,?
//                 )`,
//                 [
//                     property_id,
//                     image.filename,
//                     i === 0 ? 1 : 0,
//                     i
//                 ]
//             );
//         }
//         await connection.execute(
//             `UPDATE property_listing_progress
//             SET
//                 current_step=4,
//                 completed_percentage=45,
//                 progress=JSON_SET(
//                     progress,
//                     '$.photos',
//                     true
//                 ),
//                 last_saved_at=NOW()
//             WHERE property_id=?`,
//             [
//                 property_id
//             ]
//         );
//         await connection.commit();
//         return res.json({
//             success: true,
//             message: "Photos uploaded successfully."
//         });
//     } catch (error) {
//         await connection.rollback();
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };




// // export const saveAmenities = async (req, res) => {
// //     const connection = await db.getConnection();
// //     try {
// //         await connection.beginTransaction();
// //         const { property_id, amenities } = req.body;
// //         if (!property_id) {
// //             return res.status(422).json({
// //                 success: false,
// //                 message: "Property ID is required."
// //             });
// //         }
// //         await connection.execute(
// //             `DELETE FROM property_amenities
// //              WHERE property_id=?`,
// //             [property_id]
// //         );
// //         for (const amenityId of amenities) {
// //             await connection.execute(
// //                 `INSERT INTO property_amenities
// //                 (
// //                     property_id,
// //                     amenity_id
// //                 )
// //                 VALUES
// //                 (?,?)`,
// //                 [
// //                     property_id,
// //                     amenityId
// //                 ]
// //             );
// //         }
// //         await connection.execute(
// //             `UPDATE property_listing_progress
// //             SET
// //                 current_step=5,
// //                 completed_percentage=60,
// //                 progress=JSON_SET(
// //                     progress,
// //                     '$.amenities',
// //                     true
// //                 ),
// //                 last_saved_at=NOW()
// //             WHERE property_id=?`,
// //             [
// //                 property_id
// //             ]
// //         );
// //         await connection.commit();
// //         return res.json({
// //             success: true,
// //             message: "Amenities saved successfully."
// //         });
// //     } catch (error) {
// //         await connection.rollback();
// //         return res.status(500).json({
// //             success: false,
// //             message: error.message
// //         });
// //     } finally {
// //         connection.release();
// //     }
// // };


// export const saveAmenities = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();
//         const { property_id, amenities } = req.body;
//         if (!property_id) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Property ID is required."
//             });
//         }
//         if (!Array.isArray(amenities)) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Amenities must be an array."
//             });
//         }
//         // Remove old amenities
//         await connection.execute(
//             `DELETE FROM property_amenities
//              WHERE property_id=?`,
//             [property_id]
//         );
//         // Insert newly selected amenities
//         for (const amenityId of amenities) {
//             await connection.execute(
//                 `INSERT INTO property_amenities
//                 (
//                     property_id,
//                     amenity_id
//                 )
//                 VALUES
//                 (?,?)`,
//                 [
//                     property_id,
//                     amenityId
//                 ]
//             );
//         }
//         // Update Listing Progress
//         await connection.execute(
//             `UPDATE property_listing_progress
//             SET
//                 current_step=?,
//                 completed_percentage=?,
//                 progress=JSON_SET(
//                     progress,
//                     '$.amenities',
//                     true
//                 ),
//                 last_saved_at=NOW(),
//                 updated_at=NOW()
//             WHERE property_id=?`,
//             [
//                 5,
//                 60,
//                 property_id

//             ]
//         );
//         await connection.commit();
//         return res.json({
//             success: true,
//             message: "Amenities saved successfully."
//         });
//     } catch (error) {
//         await connection.rollback();
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };


// export const savePoliciesAndRules = async (req, res) => {

//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();
//         const {
//             property_id,
//             cancellation_policy,
//             house_rules,
//             refund_policy,
//             smoking_allowed,
//             pets_allowed,
//             parties_allowed,
//             couples_allowed,
//             children_allowed
//         } = req.body;
//         if (!property_id) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: "Property ID is required."
//             });
//         }
//         /*
//         |--------------------------------------------------------------------------
//         | PROPERTY POLICIES
//         |-------------------------------------------------------------------------
//         */
//         const [policy] = await connection.execute(
//             `SELECT id
//              FROM property_policies
//              WHERE property_id=?`,
//             [property_id]
//         );
//         if (policy.length > 0) {
//             await connection.execute(
//                 `UPDATE property_policies
//                  SET
//                     cancellation_policy=?,
//                     house_rules=?,
//                     refund_policy=?
//                  WHERE property_id=?`,
//                 [
//                     cancellation_policy ?? null,
//                     house_rules ?? null,
//                     refund_policy ?? null,
//                     property_id

//                 ]
//             );
//         } else {
//             await connection.execute(
//                 `INSERT INTO property_policies
//                 (
//                     property_id,
//                     cancellation_policy,
//                     house_rules,
//                     refund_policy
//                 )
//                 VALUES
//                 (
//                     ?,?,?,?
//                 )`,
//                 [

//                     property_id,
//                     cancellation_policy ?? null,
//                     house_rules ?? null,
//                     refund_policy ?? null

//                 ]
//             );
//         }
//         /*
//         |--------------------------------------------------------------------------
//         | PROPERTY RULES
//         |--------------------------------------------------------------------------
//         */

//         const [rules] = await connection.execute(
//             `SELECT id
//              FROM property_rules
//              WHERE property_id=?`,
//             [property_id]
//         );
//         if (rules.length > 0) {
//             await connection.execute(
//                 `UPDATE property_rules
//                  SET
//                     smoking_allowed=?,
//                     pets_allowed=?,
//                     parties_allowed=?,
//                     couples_allowed=?,
//                     children_allowed=?
//                  WHERE property_id=?`,
//                 [
//                     smoking_allowed ? 1 : 0,
//                     pets_allowed ? 1 : 0,
//                     parties_allowed ? 1 : 0,
//                     couples_allowed ? 1 : 0,
//                     children_allowed ? 1 : 0,
//                     property_id
//                 ]
//             );
//         } else {
//             await connection.execute(
//                 `INSERT INTO property_rules
//                 (
//                     property_id,
//                     smoking_allowed,
//                     pets_allowed,
//                     parties_allowed,
//                     couples_allowed,
//                     children_allowed
//                 )
//                 VALUES
//                 (
//                     ?,?,?,?,?,?
//                 )`,
//                 [
//                     property_id,
//                     smoking_allowed ? 1 : 0,
//                     pets_allowed ? 1 : 0,
//                     parties_allowed ? 1 : 0,
//                     couples_allowed ? 1 : 0,
//                     children_allowed ? 1 : 0
//               ]

//             );
//         }
//         /*
//         |--------------------------------------------------------------------------
//         | UPDATE LISTING PROGRESS
//         |--------------------------------------------------------------------------
//         */
//         await connection.execute(
//             `UPDATE property_listing_progress
//              SET
//                 current_step=?,
//                 completed_percentage=?,
//                 progress=JSON_SET(
//                     progress,
//                     '$.policies',
//                     true,
//                     '$.rules',
//                     true
//                 ),
//                 last_saved_at=NOW(),
//                 updated_at=NOW()
//              WHERE property_id=?`,
//             [
//                 6,
//                 75,
//                 property_id
//             ]
//         );
//         await connection.commit();
//         return res.status(200).json({
//             success: true,
//             message: "Policies & Rules saved successfully."
//         });
//     } catch (error) {
//         await connection.rollback();
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };




// // export const saveRooms = async (req, res) => {
// //     const connection = await pool.getConnection();
// //     try {
// //         const { property_id } = req.body;
// //         if (!property_id) {
// //             return res.status(400).json({ success: false, message: "Property ID is required." });
// //         }

// //         let rooms;
// //         try {
// //             rooms = JSON.parse(req.body.rooms);
// //         } catch {
// //             return res.status(400).json({ success: false, message: "Invalid rooms data." });
// //         }

// //         validateRooms(rooms);

// //         // group uploaded files by room index (fieldname: room_<idx>_images)
// //         const filesByRoom = {};
// //         (req.files || []).forEach((file) => {
// //             const match = file.fieldname.match(/^room_(\d+)_images$/);
// //             if (match) {
// //                 const idx = Number(match[1]);
// //                 (filesByRoom[idx] ||= []).push(file);
// //             }
// //         });

// //         await connection.beginTransaction();
// //         await deleteOldRooms(connection, property_id);

// //         for (let i = 0; i < rooms.length; i++) {
// //             rooms[i].images = filesByRoom[i] || [];
// //             await saveCompleteRoom(connection, property_id, rooms[i]);
// //         }

// //         await updatePropertyPriceRange(connection, property_id);
// //         await updateListingProgress(connection, property_id);
// //         await connection.commit();

// //         res.json({ success: true, message: "Rooms saved successfully." });
// //     } catch (error) {
// //         await connection.rollback();
// //         console.error(error);
// //         res.status(500).json({ success: false, message: error.message || "Unable to save rooms." });
// //     } finally {
// //         connection.release();
// //     }
// // };


// export const saveRooms = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         const { property_id, rooms } = req.body;
//         if (!property_id) {
//             return res.status(400).json({ success: false, message: "Property ID is required." });
//         }
//         if (!Array.isArray(rooms)) {
//             return res.status(400).json({ success: false, message: "Invalid rooms data." });
//         }

//         validateRooms(rooms);

//         // Every image_id referenced must actually belong to this property —
//         // otherwise a vendor could link another vendor's photo by guessing an id.
//         const allImageIds = [...new Set(rooms.flatMap(r => r.image_ids || []))];
//         if (allImageIds.length > 0) {
//             const placeholders = allImageIds.map(() => "?").join(",");
//             const [owned] = await pool.query(
//                 `SELECT id FROM property_images WHERE property_id = ? AND id IN (${placeholders})`,
//                 [property_id, ...allImageIds]
//             );
//             const ownedIds = new Set(owned.map(r => r.id));
//             const invalid = allImageIds.filter(id => !ownedIds.has(id));
//             if (invalid.length > 0) {
//                 return res.status(422).json({
//                     success: false,
//                     message: `These image ids don't belong to this property: ${invalid.join(", ")}`
//                 });
//             }
//         }

//         await connection.beginTransaction();
//         await deleteOldRooms(connection, property_id);

//         for (const room of rooms) {
//             await saveCompleteRoom(connection, property_id, room);
//         }

//         await updatePropertyPriceRange(connection, property_id);
//         await updateListingProgress(connection, property_id);
//         await connection.commit();

//         res.json({ success: true, message: "Rooms saved successfully." });
//     } catch (error) {
//         await connection.rollback();
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message || "Unable to save rooms." });
//     } finally {
//         connection.release();
//     }
// };



// export const publishListing = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         const vendorId = req.vendor.id;
//         const { property_id } = req.body;

//         if (!property_id) {
//             return res.status(422).json({
//                 success: false,
//                 message: "Property ID is required."
//             });
//         }

//         await connection.beginTransaction();

//         // Ownership check — don't let a vendor publish someone else's property
//         const [propertyRows] = await connection.execute(
//             `SELECT id, vendor_id FROM properties WHERE id=?`,
//             [property_id]
//         );
//         if (propertyRows.length === 0 || propertyRows[0].vendor_id !== vendorId) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: "Property not found."
//             });
//         }

//         // Optional but recommended: verify every step was actually completed
//         const [progressRows] = await connection.execute(
//             `SELECT progress FROM property_listing_progress WHERE property_id=?`,
//             [property_id]
//         );
//         if (progressRows.length === 0) {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: "No listing progress found for this property."
//             });
//         }

//         const progress = JSON.parse(progressRows[0].progress || "{}");
//         const requiredSteps = [
//             "basic_info", "location", "photos",
//             "amenities", "policies", "rules", "rooms"
//         ];
//         const missing = requiredSteps.filter((k) => !progress[k]);
//         if (missing.length > 0) {
//             await connection.rollback();
//             return res.status(422).json({
//                 success: false,
//                 message: `Please complete: ${missing.join(", ")} before publishing.`
//             });
//         }

//         // Flip property to pending review
//         await connection.execute(
//             `UPDATE properties
//              SET status='pending', updated_at=NOW()
//              WHERE id=?`,
//             [property_id]
//         );

//         // Mark the wizard/draft as completed
//         await connection.execute(
//             `UPDATE property_listing_progress
//              SET is_completed=1,
//                  completed_percentage=100,
//                  last_saved_at=NOW(),
//                  updated_at=NOW()
//              WHERE property_id=?`,
//             [property_id]
//         );

//         await connection.commit();

//         return res.json({
//             success: true,
//             message: "Listing submitted for review successfully."
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };




import pool from "../../config/db.js";
import {
    deleteOldRooms,
    saveCompleteRoom,
    updateListingProgress,
    updatePropertyPriceRange,
    validateRooms,
} from "../../services/rooms.service.js";

export const getIncompleteListing = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const [progressRows] = await pool.execute(
            `
            SELECT *
            FROM property_listing_progress
            WHERE vendor_id=?
            AND is_completed=0
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [vendorId]
        );
        if (progressRows.length === 0) {
            return res.json({
                success: true,
                hasListing: false,
                message: "No incomplete listing found."
            });
        }
        const progress = progressRows[0];
        const propertyId = progress.property_id;

        // Property
        const [property] = await pool.execute(
            `SELECT * FROM properties WHERE id=?`,
            [propertyId]
        );
        // Address
        const [address] = await pool.execute(
            `SELECT * FROM property_addresses WHERE property_id=?`,
            [propertyId]
        );
        // Images — this is now the FULL photo pool: used both as the
        // property gallery AND as the source list for the room image picker.
        const [images] = await pool.execute(
            `SELECT * FROM property_images WHERE property_id=? ORDER BY sort_order ASC`,
            [propertyId]
        );
        // Amenities
        const [amenities] = await pool.execute(
            `SELECT amenity_id FROM property_amenities WHERE property_id=?`,
            [propertyId]
        );
        // Policies
        const [policies] = await pool.execute(
            `SELECT * FROM property_policies WHERE property_id=?`,
            [propertyId]
        );
        // Rules
        const [rules] = await pool.execute(
            `SELECT * FROM property_rules WHERE property_id=?`,
            [propertyId]
        );

        // Rooms (base rows + price)
        const [roomRows] = await pool.execute(
            `
            SELECT r.*, rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax
            FROM rooms r
            LEFT JOIN room_prices rp ON rp.room_id = r.id
            WHERE r.property_id = ?
            ORDER BY r.id ASC
            `,
            [propertyId]
        );

        let rooms = [];

        if (roomRows.length > 0) {
            const roomIds = roomRows.map((r) => r.id);
            const placeholders = roomIds.map(() => "?").join(",");

            const [beds] = await pool.query(
                `SELECT * FROM room_beds WHERE room_id IN (${placeholders})`,
                roomIds
            );
            const [dormBeds] = await pool.query(
                `SELECT * FROM room_dorm_beds WHERE room_id IN (${placeholders})`,
                roomIds
            );
            // Room images now come through the link table, joined back to
            // property_images so we still get the actual filename.
            const [roomImageLinks] = await pool.query(
                `SELECT rpi.room_id, rpi.is_cover, rpi.sort_order,
                        pi.id AS property_image_id, pi.image
                 FROM room_property_images rpi
                 JOIN property_images pi ON pi.id = rpi.property_image_id
                 WHERE rpi.room_id IN (${placeholders})
                 ORDER BY rpi.sort_order ASC`,
                roomIds
            );

            rooms = roomRows.map((room) => ({
                ...room,
                beds: beds.filter((b) => b.room_id === room.id),
                dorm_beds: dormBeds.filter((b) => b.room_id === room.id),
                images: roomImageLinks.filter((i) => i.room_id === room.id)
            }));
        }

        return res.json({
            success: true,
            hasListing: true,
            property_id: propertyId,
            current_step: progress.current_step,
            progress: progress,
            property: property[0] || null,
            address: address[0] || null,
            images,
            amenities,
            policies: policies[0] || null,
            rules: rules[0] || null,
            rooms
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const saveBasicInformation = async (req, res) => {
    const connection = await pool.getConnection();
    try {

        await connection.beginTransaction();
        const vendor_id = req.vendor.id

        const {
            property_id,
            property_type_id,
            property_name,
            description,
            star_rating,
            contact_name,
            contact_number,
            email,
            website,
            check_in,
            check_out,
            total_rooms
        } = req.body;

        if (!vendor_id || !property_type_id || !property_name) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Vendor, Property Type and Property Name are required."
            });
        }
        let propertyId = property_id;
        // ==========================================
        // CREATE PROPERTY
        // =========================================
        if (!propertyId) {
            const slug = property_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            const [propertyResult] = await connection.execute(
                `
                INSERT INTO properties
                (
                    vendor_id,
                    property_type_id,
                    property_name,
                    slug,
                    description,
                    star_rating,
                    contact_name,
                    contact_number,
                    email,
                    website,
                    check_in,
                    check_out,
                    total_rooms,
                    status,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                    NOW(),
                    NOW()
                )
                `,
                [
                    vendor_id,
                    property_type_id,
                    property_name,
                    slug,
                    description ?? null,
                    star_rating ?? 0,
                    contact_name ?? null,
                    contact_number ?? null,
                    email ?? null,
                    website ?? null,
                    check_in ?? null,
                    check_out ?? null,
                    total_rooms ?? 0,
                    "draft"
                ]
            );
            propertyId = propertyResult.insertId;
            await connection.execute(
                `
                INSERT INTO property_listing_progress
                (
                    property_id,
                    vendor_id,
                    current_step,
                    progress,
                    completed_percentage,
                    is_completed,
                    last_saved_at,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW(),
                    NOW(),
                    NOW()
                )
                `,
                [
                    propertyId,
                    vendor_id,
                    2,
                    JSON.stringify({
                        basic_info: true
                    }),
                    15,
                    0
                ]
            );
        }
        // ==========================================
        // UPDATE PROPERTY
        // ==========================================
        else {
            const slug = property_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            await connection.execute(
                `
                UPDATE properties
                SET
                    property_type_id=?,
                    property_name=?,
                    slug=?,
                    description=?,
                    star_rating=?,
                    contact_name=?,
                    contact_number=?,
                    email=?,
                    website=?,
                    check_in=?,
                    check_out=?,
                    total_rooms=?,
                    updated_at=NOW()

                WHERE id=?
                `,
                [
                    property_type_id,
                    property_name,
                    slug,
                    description ?? null,
                    star_rating ?? 0,
                    contact_name ?? null,
                    contact_number ?? null,
                    email ?? null,
                    website ?? null,
                    check_in ?? null,
                    check_out ?? null,
                    total_rooms ?? 0,
                    propertyId
                ]
            );
            await connection.execute(
                `
                UPDATE property_listing_progress
                SET
                    current_step=?,
                    progress=?,
                    completed_percentage=?,
                    last_saved_at=NOW(),
                    updated_at=NOW()
                WHERE property_id=?
                `,
                [
                    2,
                    JSON.stringify({
                        basic_info: true
                    }),
                    15,
                    propertyId
                ]
            );
        }
        await connection.commit();
        return res.status(200).json({
            success: true,
            property_id: propertyId,
            current_step: 2,
            message: "Basic information saved successfully."
        });
    } catch (error) {
        console.log(error);
        await connection.rollback();
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};


export const saveLocation = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            property_id,
            country,
            state,
            city,
            area,
            address,
            pincode,
            landmark
        } = req.body;
        if (!property_id) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Property ID is required."
            });
        }
        // Check if location already exists
        const [existing] = await connection.execute(
            `SELECT id FROM property_addresses WHERE property_id = ?`,
            [property_id]
        );
        if (existing.length > 0) {
            // Update Location
            await connection.execute(
                `UPDATE property_addresses
                 SET
                    country=?,
                    state=?,
                    city=?,
                    area=?,
                    address=?,
                    pincode=?,
                    landmark=?
                 WHERE property_id=?`,

                [
                    country ?? null,
                    state ?? null,
                    city ?? null,
                    area ?? null,
                    address ?? null,
                    pincode ?? null,
                    landmark ?? null,
                    property_id
                ]
            );

        } else {
            // Insert Location
            await connection.execute(
                `INSERT INTO property_addresses
                (
                    property_id,
                    country,
                    state,
                    city,
                    area,
                    address,
                    pincode,
                    landmark
                )
                VALUES
                (
                    ?,?,?,?,?,?,?,?
                )`,

                [
                    property_id,
                    country ?? null,
                    state ?? null,
                    city ?? null,
                    area ?? null,
                    address ?? null,
                    pincode ?? null,
                    landmark ?? null
                ]
            );
        }
        // Update Progress
        await connection.execute(
            `UPDATE property_listing_progress
            SET
                current_step = ?,
                completed_percentage = ?,
                progress = JSON_SET(
                    progress,
                    '$.location',
                  true
                ),
                last_saved_at = NOW(),
                updated_at = NOW()
            WHERE property_id = ?`,
            [
                3,
                30,
                property_id
            ]
        );
        await connection.commit();
        return res.status(200).json({
            success: true,
            current_step: 3,
            message: "Location saved successfully."
        });
    } catch (error) {
        await connection.rollback();
        return res.status(500).json({

            success: false,

            message: error.message

        });
    } finally {
        connection.release();
    }
};


export const savePropertyImages = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { property_id } = req.body;
        if (!property_id) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Property ID is required."
            });
        }
        if (!req.files || req.files.length === 0) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Please upload at least one image."
            });
        }
        // Delete previous images. Because room_property_images has
        // ON DELETE CASCADE on property_image_id, any room that was using a
        // photo the vendor is now replacing will simply lose that link —
        // it won't error, but the room may end up with fewer/zero images.
        // See note at the end of this file about warning vendors on re-upload.
        await connection.execute(
            `DELETE FROM property_images
             WHERE property_id=?`,
            [property_id]
        );
        for (let i = 0; i < req.files.length; i++) {
            const image = req.files[i];
            await connection.execute(
                `INSERT INTO property_images
                (
                    property_id,
                    image,
                    is_cover,
                    sort_order
                )
                VALUES
                (
                    ?,?,?,?
                )`,
                [
                    property_id,
                    image.filename,
                    i === 0 ? 1 : 0,
                    i
                ]
            );
        }
        await connection.execute(
            `UPDATE property_listing_progress
            SET
                current_step=4,
                completed_percentage=45,
                progress=JSON_SET(
                    progress,
                    '$.photos',
                    true
                ),
                last_saved_at=NOW()
            WHERE property_id=?`,
            [
                property_id
            ]
        );
        await connection.commit();
        return res.json({
            success: true,
            message: "Photos uploaded successfully."
        });
    } catch (error) {
        await connection.rollback();
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};


export const saveAmenities = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { property_id, amenities } = req.body;
        if (!property_id) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Property ID is required."
            });
        }
        if (!Array.isArray(amenities)) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Amenities must be an array."
            });
        }
        // Remove old amenities
        await connection.execute(
            `DELETE FROM property_amenities
             WHERE property_id=?`,
            [property_id]
        );
        // Insert newly selected amenities
        for (const amenityId of amenities) {
            await connection.execute(
                `INSERT INTO property_amenities
                (
                    property_id,
                    amenity_id
                )
                VALUES
                (?,?)`,
                [
                    property_id,
                    amenityId
                ]
            );
        }
        // Update Listing Progress
        await connection.execute(
            `UPDATE property_listing_progress
            SET
                current_step=?,
                completed_percentage=?,
                progress=JSON_SET(
                    progress,
                    '$.amenities',
                    true
                ),
                last_saved_at=NOW(),
                updated_at=NOW()
            WHERE property_id=?`,
            [
                5,
                60,
                property_id

            ]
        );
        await connection.commit();
        return res.json({
            success: true,
            message: "Amenities saved successfully."
        });
    } catch (error) {
        await connection.rollback();
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};


export const savePoliciesAndRules = async (req, res) => {

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const {
            property_id,
            cancellation_policy,
            house_rules,
            refund_policy,
            smoking_allowed,
            pets_allowed,
            parties_allowed,
            couples_allowed,
            children_allowed
        } = req.body;
        if (!property_id) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: "Property ID is required."
            });
        }
        /*
        |--------------------------------------------------------------------------
        | PROPERTY POLICIES
        |-------------------------------------------------------------------------
        */
        const [policy] = await connection.execute(
            `SELECT id
             FROM property_policies
             WHERE property_id=?`,
            [property_id]
        );
        if (policy.length > 0) {
            await connection.execute(
                `UPDATE property_policies
                 SET
                    cancellation_policy=?,
                    house_rules=?,
                    refund_policy=?
                 WHERE property_id=?`,
                [
                    cancellation_policy ?? null,
                    house_rules ?? null,
                    refund_policy ?? null,
                    property_id

                ]
            );
        } else {
            await connection.execute(
                `INSERT INTO property_policies
                (
                    property_id,
                    cancellation_policy,
                    house_rules,
                    refund_policy
                )
                VALUES
                (
                    ?,?,?,?
                )`,
                [

                    property_id,
                    cancellation_policy ?? null,
                    house_rules ?? null,
                    refund_policy ?? null

                ]
            );
        }
        /*
        |--------------------------------------------------------------------------
        | PROPERTY RULES
        |--------------------------------------------------------------------------
        */

        const [rules] = await connection.execute(
            `SELECT id
             FROM property_rules
             WHERE property_id=?`,
            [property_id]
        );
        if (rules.length > 0) {
            await connection.execute(
                `UPDATE property_rules
                 SET
                    smoking_allowed=?,
                    pets_allowed=?,
                    parties_allowed=?,
                    couples_allowed=?,
                    children_allowed=?
                 WHERE property_id=?`,
                [
                    smoking_allowed ? 1 : 0,
                    pets_allowed ? 1 : 0,
                    parties_allowed ? 1 : 0,
                    couples_allowed ? 1 : 0,
                    children_allowed ? 1 : 0,
                    property_id
                ]
            );
        } else {
            await connection.execute(
                `INSERT INTO property_rules
                (
                    property_id,
                    smoking_allowed,
                    pets_allowed,
                    parties_allowed,
                    couples_allowed,
                    children_allowed
                )
                VALUES
                (
                    ?,?,?,?,?,?
                )`,
                [
                    property_id,
                    smoking_allowed ? 1 : 0,
                    pets_allowed ? 1 : 0,
                    parties_allowed ? 1 : 0,
                    couples_allowed ? 1 : 0,
                    children_allowed ? 1 : 0
              ]

            );
        }
        /*
        |--------------------------------------------------------------------------
        | UPDATE LISTING PROGRESS
        |--------------------------------------------------------------------------
        */
        await connection.execute(
            `UPDATE property_listing_progress
             SET
                current_step=?,
                completed_percentage=?,
                progress=JSON_SET(
                    progress,
                    '$.policies',
                    true,
                    '$.rules',
                    true
                ),
                last_saved_at=NOW(),
                updated_at=NOW()
             WHERE property_id=?`,
            [
                6,
                75,
                property_id
            ]
        );
        await connection.commit();
        return res.status(200).json({
            success: true,
            message: "Policies & Rules saved successfully."
        });
    } catch (error) {
        await connection.rollback();
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};


/**
 * saveRooms — CHANGED.
 * No more multer/req.files. Rooms arrive as plain JSON, each with
 * `image_ids` pointing at rows the vendor already uploaded via /photos.
 * We verify every referenced id actually belongs to this property before
 * touching the DB, so a vendor can't link another property's photo by
 * guessing an id.
 */
export const saveRooms = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { property_id, rooms } = req.body;

        if (!property_id) {
            return res.status(400).json({ success: false, message: "Property ID is required." });
        }
        if (!Array.isArray(rooms)) {
            return res.status(400).json({ success: false, message: "Invalid rooms data." });
        }

        validateRooms(rooms);

        const allImageIds = [...new Set(rooms.flatMap((r) => r.image_ids || []))];
        if (allImageIds.length > 0) {
            const placeholders = allImageIds.map(() => "?").join(",");
            const [owned] = await pool.query(
                `SELECT id FROM property_images WHERE property_id = ? AND id IN (${placeholders})`,
                [property_id, ...allImageIds]
            );
            const ownedIds = new Set(owned.map((r) => r.id));
            const invalid = allImageIds.filter((id) => !ownedIds.has(id));
            if (invalid.length > 0) {
                return res.status(422).json({
                    success: false,
                    message: `These image ids don't belong to this property: ${invalid.join(", ")}`
                });
            }
        }

        await connection.beginTransaction();
        await deleteOldRooms(connection, property_id);

        for (const room of rooms) {
            await saveCompleteRoom(connection, property_id, room);
        }

        await updatePropertyPriceRange(connection, property_id);
        await updateListingProgress(connection, property_id);
        await connection.commit();

        res.json({ success: true, message: "Rooms saved successfully." });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || "Unable to save rooms." });
    } finally {
        connection.release();
    }
};



export const publishListing = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const vendorId = req.vendor.id;
        const { property_id } = req.body;

        if (!property_id) {
            return res.status(422).json({
                success: false,
                message: "Property ID is required."
            });
        }

        await connection.beginTransaction();

        // Ownership check — don't let a vendor publish someone else's property
        const [propertyRows] = await connection.execute(
            `SELECT id, vendor_id FROM properties WHERE id=?`,
            [property_id]
        );
        if (propertyRows.length === 0 || propertyRows[0].vendor_id !== vendorId) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Property not found."
            });
        }

        // Optional but recommended: verify every step was actually completed
        const [progressRows] = await connection.execute(
            `SELECT progress FROM property_listing_progress WHERE property_id=?`,
            [property_id]
        );
        if (progressRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "No listing progress found for this property."
            });
        }

        const progress = JSON.parse(progressRows[0].progress || "{}");
        const requiredSteps = [
            "basic_info", "location", "photos",
            "amenities", "policies", "rules", "rooms"
        ];
        const missing = requiredSteps.filter((k) => !progress[k]);
        if (missing.length > 0) {
            await connection.rollback();
            return res.status(422).json({
                success: false,
                message: `Please complete: ${missing.join(", ")} before publishing.`
            });
        }

        // Flip property to pending review
        await connection.execute(
            `UPDATE properties
             SET status='pending', updated_at=NOW()
             WHERE id=?`,
            [property_id]
        );

        // Mark the wizard/draft as completed
        await connection.execute(
            `UPDATE property_listing_progress
             SET is_completed=1,
                 completed_percentage=100,
                 last_saved_at=NOW(),
                 updated_at=NOW()
             WHERE property_id=?`,
            [property_id]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Listing submitted for review successfully."
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};