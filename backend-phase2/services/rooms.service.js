// import pool from "../config/db.js";
// /*
// |--------------------------------------------------------------------------
// | Delete Existing Rooms
// |--------------------------------------------------------------------------
// |
// | Assumption:
// | Foreign keys use ON DELETE CASCADE
// |
// | rooms
// |   ├── room_images
// |   ├── room_prices
// |   ├── room_beds
// |   ├── room_dorm_beds
// |   └── room_availability
// |
// */
// export const deleteOldRooms = async (connection, propertyId) => {
//     await connection.execute(
//         `
//         DELETE FROM rooms
//         WHERE property_id=?
//         `,
//         [propertyId]
//     );
// };
// /*
// |--------------------------------------------------------------------------
// | Create Room
// |--------------------------------------------------------------------------
// */
// // export const createRoom = async (connection, propertyId, room) => {
// //     const {
// //         room_name,
// //         room_type,
// //         max_adults,
// //         max_children,
// //         total_rooms,
// //         available_rooms,
// //         room_size,
// //         room_size_unit,
// //         private_bathroom,
// //         balcony,
// //         air_conditioning,
// //         description
// //     } = room;
// //     const [result] = await connection.execute(
// //         `
// //         INSERT INTO rooms
// //         (
// //             property_id,
// //             room_name,
// //             room_type,
// //             max_adults,
// //             max_children,
// //             total_rooms,
// //             available_rooms,
// //             room_size,
// //             room_size_unit,
// //             private_bathroom,
// //             balcony,
// //             air_conditioning,
// //             description
// //         )
// //         VALUES
// //         (
// //             ?,?,?,?,?,?,?,?,?,?,?,?
// //         )
// //         `,
// //         [
// //             propertyId,
// //             room_name,
// //             room_type,
// //             max_adults ?? 0,
// //             max_children ?? 0,
// //             total_rooms ?? 0,
// //             available_rooms ?? total_rooms ?? 0,
// //             room_size ?? null,
// //             room_size_unit ?? "sqft",
// //             private_bathroom ? 1 : 0,
// //             balcony ? 1 : 0,
// //             air_conditioning ? 1 : 0,
// //             description ?? null
// //         ]
// //     );

// //     return result.insertId;
// // };


// export const createRoom = async (
//     connection,
//     propertyId,
//     room
// ) => {

//     const [result] = await connection.execute(
//         `
//         INSERT INTO rooms
//         (
//             property_id,
//             room_name,
//             room_type,
//             room_category,
//             max_adults,
//             max_children,
//             total_rooms,
//             available_rooms,
//             room_size,
//             room_size_unit,
//             private_bathroom,
//             balcony,
//             air_conditioning,
//             description
//         )
//         VALUES
//         (
//             ?,?,?,?,?,?,?,?,?,?,?,?,?,?
//         )
//         `,
//         [
//             propertyId,
//             room.room_name,
//             room.room_type,
//             room.room_category,
//             Number(room.max_adults),
//             Number(room.max_children),
//             Number(room.total_rooms),
//             Number(room.available_rooms),
//             Number(room.room_size),
//             room.room_size_unit,
//             room.private_bathroom ? 1 : 0,
//             room.balcony ? 1 : 0,
//             room.air_conditioning ? 1 : 0,
//             room.description || null
//         ]
//     );

//     return result.insertId;

// };

// // export const saveRoomPrice = async (
// //     connection,
// //     roomId,
// //     priceData = {}
// // ) => {
// //     const {
// //         price,
// //         weekend_price,
// //         extra_guest_price,
// //         tax
// //     } = priceData;
// //     await connection.execute(
// //         `
// //         INSERT INTO room_prices
// //         (
// //             room_id,
// //             price,
// //             weekend_price,
// //             extra_guest_price,
// //             tax
// //         )
// //         VALUES
// //         (
// //             ?,?,?,?,?
// //         )
// //         `,
// //         [
// //             roomId,
// //             price ?? 0,
// //             weekend_price ?? price ?? 0,
// //             extra_guest_price ?? 0,
// //             tax ?? 0
// //         ]
// //     );
// // };


// export const saveRoomPrice = async (
//     connection,
//     roomId,
//     room
// ) => {

//     await connection.execute(
//         `
//         INSERT INTO room_prices
//         (
//             room_id,
//             price,
//             weekend_price,
//             extra_guest_price,
//             tax
//         )
//         VALUES
//         (
//             ?,?,?,?,?
//         )
//         `,
//         [
//             roomId,
//             room.price,
//             room.weekend_price,
//             room.extra_guest_price,
//             room.tax
//         ]
//     );

// };


// export const saveRoomImages = async (
//     connection,
//     roomId,
//     files = []
// ) => {

//     if (!files.length) return;

//     for (let i = 0; i < files.length; i++) {

//         await connection.execute(
//             `
//             INSERT INTO room_images
//             (
//                 room_id,
//                 image,
//                 is_cover,
//                 sort_order
//             )
//             VALUES
//             (
//                 ?,?,?,?
//             )
//             `,
//             [
//                 roomId,
//                 files[i].filename,
//                 i === 0 ? 1 : 0,
//                 i
//             ]
//         );

//     }

// };

// export const saveRoomBeds = async (
//     connection,
//     roomId,
//     beds = []
// ) => {
//     if (!Array.isArray(beds) || beds.length === 0) {
//         return;
//     }
//     for (const bed of beds) {
//         await connection.execute(
//             `
//             INSERT INTO room_beds
//             (
//                 room_id,
//                 bed_type,
//                 quantity
//             )
//             VALUES
//             (
//                 ?,?,?
//             )
//             `,
//             [
//                 roomId,
//                 bed.bed_type,
//                 bed.quantity ?? 1
//             ]
//         );
//     }
// };

// /*
// |--------------------------------------------------------------------------
// | Validate Rooms
// |--------------------------------------------------------------------------
// */

// export const validateRooms = (rooms) => {
//     if (!Array.isArray(rooms)) {
//         throw new Error("Rooms must be an array.");
//     }
//     if (rooms.length === 0) {
//         throw new Error("At least one room is required.");
//     }
//     for (const room of rooms) {
//         if (!room.room_name) {
//             throw new Error("Room name is required.");
//         }
//         if (!room.room_type) {
//             throw new Error(
//                 `Room type is required for ${room.room_name}`
//             );
//         }
//         if (room.max_adults < 1) {
//             throw new Error(
//                 `${room.room_name} must allow at least one adult`
//             );
//         }
//         if (room.total_rooms < 1) {
//             throw new Error(
//                 `${room.room_name} must have at least one room`
//            );
//         }
//     }
// };
// /*
// |--------------------------------------------------------------------------
// | Calculate Lowest & Highest Room Price
// |--------------------------------------------------------------------------
// */
// export const calculatePriceRange = (rooms = []) => {
//     const prices = [];
//     for (const room of rooms) {
//         if (room.price && room.price.price != null) {
//             prices.push(Number(room.price.price));
//         }
//     }
//     if (prices.length === 0) {
//         return {
//             min: 0,
//             max: 0
//         };
//     }
//     return {
//         min: Math.min(...prices),
//         max: Math.max(...prices)
//     };
// };



// // export const saveRoomImages = async (
// //     connection,
// //     roomId,
// //     images = []
// // ) => {
// //     if (!Array.isArray(images) || images.length === 0) {
// //         return;
// //     }
// //     for (let i = 0; i < images.length; i++) {
// //         await connection.execute(
// //             `
// //             INSERT INTO room_images
// //             (
// //                 room_id,
// //                 image
// //             )
// //             VALUES
// //             (
// //                 ?,?
// //             )
// //             `,
// //             [
// //                 roomId,
// //                 images[i]
// //             ]
// //         );
// //     }
// // };



// export const saveDormBeds = async (
//     connection,
//     roomId,
//     dormBeds = []
// ) => {
//     if (!Array.isArray(dormBeds) || dormBeds.length === 0) {
//         return;
//     }

//     for (const bed of dormBeds) {
//         await connection.execute(
//             `
//             INSERT INTO room_dorm_beds
//             (
//                 room_id,
//                 bed_label,
//                 bed_type,
//                 status,
//                 price
//             )
//             VALUES
//             (
//                 ?,?,?,?,?
//             )
//             `,
//             [
//                 roomId,
//                 bed.bed_label,
//                 bed.bed_type,
//                 bed.status ?? "available",
//                 bed.price ?? 0
//             ]
//         );
//     }
// };

// export const updatePropertyPriceRange = async (
//     connection,
//     propertyId
// ) => {
//     const [rows] = await connection.execute(
//         `
//         SELECT
//             MIN(rp.price) AS min_price,
//             MAX(rp.price) AS max_price
//         FROM rooms r
//         JOIN room_prices rp
//             ON r.id = rp.room_id
//         WHERE r.property_id = ?
//         `,
//         [propertyId]
//     );
//     const minPrice = rows[0].min_price ?? 0;
//     const maxPrice = rows[0].max_price ?? 0;
//     await connection.execute(
//         `
//         UPDATE properties
//         SET
//             min_price=?,
//             max_price=?,
//             updated_at=NOW()
//         WHERE id=?
//         `,
//         [
//             minPrice,
//             maxPrice,
//             propertyId
//         ]
//     );
// };



// export const updateListingProgress = async (
//     connection,
//     propertyId
// ) => {

//     await connection.execute(
//         `
//         UPDATE property_listing_progress
//         SET
//             current_step=?,
//             completed_percentage=?,
//             progress=JSON_SET(
//                 progress,
//                 '$.rooms',
//                 true
//             ),
//             last_saved_at=NOW(),
//             updated_at=NOW()
//         WHERE property_id=?
//         `,
//         [
//             7,
//             100,
//             propertyId
//         ]
//     );
// };



// export const saveCompleteRoom = async (
//     connection,
//     propertyId,
//     room
// ) => {
//     const roomId = await createRoom(
//         connection,
//         propertyId,
//         room
//     );
//     await saveRoomPrice(
//         connection,
//         roomId,
//         room.price
//     );
//     await saveRoomBeds(
//         connection,
//         roomId,
//         room.beds
//     );
//     await saveRoomImages(
//         connection,
//         roomId,
//         room.images
//     );
//     if (
//         room.room_type &&
//         room.room_type.toLowerCase().includes("dorm")
//     ) {
//         await saveDormBeds(
//             connection,
//             roomId,
//             room.dormBeds
//         );

//     }
//     return roomId;
// };





import pool from "../config/db.js";

export const deleteOldRooms = async (connection, propertyId) => {
    await connection.execute(
        `DELETE FROM rooms WHERE property_id=?`,
        [propertyId]
    );
};

export const createRoom = async (connection, propertyId, room) => {
    const [result] = await connection.execute(
        `
        INSERT INTO rooms
        (
            property_id, room_name, room_type, room_category,
            max_adults, max_children, total_rooms, available_rooms,
            room_size, room_size_unit, private_bathroom, balcony,
            air_conditioning, description
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
        [
            propertyId,
            room.room_name,
            room.room_type,
            room.room_category || "private",
            Number(room.max_adults) || 0,
            Number(room.max_children) || 0,
            Number(room.total_rooms) || 0,
            Number(room.available_rooms) || 0,
            Number(room.room_size) || 0,
            room.room_size_unit || "sqft",
            room.private_bathroom ? 1 : 0,
            room.balcony ? 1 : 0,
            room.air_conditioning ? 1 : 0,
            room.description || null
        ]
    );
    return result.insertId;
};

export const saveRoomPrice = async (connection, roomId, room) => {
    await connection.execute(
        `
        INSERT INTO room_prices
        (room_id, price, weekend_price, extra_guest_price, tax)
        VALUES (?,?,?,?,?)
        `,
        [
            roomId,
            room.price ?? 0,
            room.weekend_price ?? room.price ?? 0,
            room.extra_guest_price ?? 0,
            room.tax ?? 0
        ]
    );
};

// files = multer file objects grouped for this room, in upload order
export const saveRoomImages = async (connection, roomId, files = [], coverIndex = 0) => {
    if (!files.length) return;
    for (let i = 0; i < files.length; i++) {
        await connection.execute(
            `
            INSERT INTO room_images (room_id, image, is_cover, sort_order)
            VALUES (?,?,?,?)
            `,
            [
                roomId,
                files[i].filename,
                i === coverIndex ? 1 : 0,
                i
            ]
        );
    }
};

export const saveRoomBeds = async (connection, roomId, beds = []) => {
    if (!Array.isArray(beds) || beds.length === 0) return;
    for (const bed of beds) {
        await connection.execute(
            `INSERT INTO room_beds (room_id, bed_type, quantity) VALUES (?,?,?)`,
            [roomId, bed.bed_type, bed.quantity ?? 1]
        );
    }
};

export const saveDormBeds = async (connection, roomId, dormBeds = []) => {
    if (!Array.isArray(dormBeds) || dormBeds.length === 0) return;
    for (const bed of dormBeds) {
        await connection.execute(
            `
            INSERT INTO room_dorm_beds (room_id, bed_label, bed_type, status, price)
            VALUES (?,?,?,?,?)
            `,
            [
                roomId,
                bed.bed_label,
                bed.bed_type,
                bed.status ?? "available",
                bed.price ?? 0
            ]
        );
    }
};

export const validateRooms = (rooms) => {
    if (!Array.isArray(rooms) || rooms.length === 0) {
        throw new Error("At least one room is required.");
    }
    for (const room of rooms) {
        if (!room.room_name) throw new Error("Room name is required.");
        if (!room.room_type) throw new Error(`Room type is required for ${room.room_name}`);
        if (room.room_category !== "dorm" && Number(room.max_adults) < 1) {
            throw new Error(`${room.room_name} must allow at least one adult`);
        }
        if (Number(room.total_rooms) < 1) {
            throw new Error(`${room.room_name} must have at least one room`);
        }
    }
};

export const updatePropertyPriceRange = async (connection, propertyId) => {
    const [rows] = await connection.execute(
        `
        SELECT MIN(rp.price) AS min_price, MAX(rp.price) AS max_price
        FROM rooms r
        JOIN room_prices rp ON r.id = rp.room_id
        WHERE r.property_id = ?
        `,
        [propertyId]
    );
    await connection.execute(
        `UPDATE properties SET min_price=?, max_price=?, updated_at=NOW() WHERE id=?`,
        [rows[0].min_price ?? 0, rows[0].max_price ?? 0, propertyId]
    );
};

export const updateListingProgress = async (connection, propertyId) => {
    await connection.execute(
        `
        UPDATE property_listing_progress
        SET current_step=?, completed_percentage=?,
            progress=JSON_SET(progress, '$.rooms', true),
            last_saved_at=NOW(), updated_at=NOW()
        WHERE property_id=?
        `,
        [7, 100, propertyId]
    );
};

export const saveCompleteRoom = async (connection, propertyId, room) => {
    const roomId = await createRoom(connection, propertyId, room);
    await saveRoomPrice(connection, roomId, room);          // fixed: pass whole room
    await saveRoomBeds(connection, roomId, room.beds);

    if (room.room_category === "dorm") {                    // fixed: use room_category
        await saveDormBeds(connection, roomId, room.dorm_beds); // fixed: snake_case field
    }

    await saveRoomImages(
        connection,
        roomId,
        room.images,
        room.cover_index ?? 0
    );

    return roomId;
};