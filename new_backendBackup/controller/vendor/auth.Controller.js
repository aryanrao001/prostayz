import bcrypt from "bcrypt";
import pool from "../../config/db.js";

/**
 * Register Vendor
 */
export const register = async (req, res) => {
    try {

        const {
            first_name,
            last_name,
            email,
            phone,
            country_code,
            password,
            business_name
        } = req.body;

        if (!first_name || !last_name || !email || !phone || !password) {
            return res.status(422).json({
                success: false,
                message: "All required fields are mandatory."
            });
        }

        const [existing] = await pool.query(
            "SELECT id FROM vendors WHERE email=? OR phone=?",
            [email, phone]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "Vendor already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO vendors
            (
                first_name,
                last_name,
                email,
                phone,
                country_code,
                password,
                business_name,
                status
            )
            VALUES (?,?,?,?,?,?,?,?)`,
            [
                first_name,
                last_name,
                email,
                phone,
                country_code || "+91",
                hashedPassword,
                business_name || null,
                "active"
            ]
        );

        req.session.vendorId = result.insertId;

        return res.status(201).json({
            success: true,
            message: "Registration successful."
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

/**
 * Login Vendor
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                success: false,
                message: "Email and Password are required."
            });
        }
        const [rows] = await pool.execute(
            `SELECT * FROM vendors WHERE email = ? LIMIT 1`,
            [email]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found."
            });
        }
        const vendor = rows[0];
        if (vendor.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact the administrator."
            });
        }
        const match = await bcrypt.compare(
            password,
            vendor.password
        );
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }
        // Update Last Login
        await pool.execute(
            `UPDATE vendors
             SET last_login_at = NOW()
             WHERE id = ?`,
            [vendor.id]
        );
        // Regenerate Session ID
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to create session."
                });
            }
            req.session.vendorId = vendor.id;
            const vendorData = {
                id: vendor.id,
                first_name: vendor.first_name,
                last_name: vendor.last_name,
                full_name: `${vendor.first_name} ${vendor.last_name}`,
                email: vendor.email,
                phone: vendor.phone,
                country_code: vendor.country_code,
                profile_image: vendor.profile_image,
                business_name: vendor.business_name,
                gst_number: vendor.gst_number,
                pan_number: vendor.pan_number,
                status: vendor.status,
                last_login_at: new Date()
            };
            return res.status(200).json({
                success: true,
                message: "Login successful.",
                vendor: vendorData
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};



export const verifyVendor = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const [vendors] = await pool.query(
            `SELECT
                id,
                first_name,
                email,
                phone,
                business_name,
                profile_image,
                status,
                created_at
             FROM vendors
             WHERE id = ?`,
            [vendorId]
        );
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }
        const vendor = vendors[0];
        if (vendor.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Vendor account is inactive"
            });
        }
        return res.status(200).json({
            success: true,
            vendor
        });
    } catch (error) {
        console.error("Verify Vendor Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const checkVendorSetup = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 1 : Vendor Address
        |--------------------------------------------------------------------------
        */

        const [vendorAddress] = await pool.query(
            `SELECT id
             FROM vendor_addresses
             WHERE vendor_id = ?
             LIMIT 1`,
            [vendorId]
        );

        if (vendorAddress.length === 0) {
            return res.status(200).json({
                success: true,
                currentStep: 1,
                step: "address",
                redirect: "/vendor/setup/address",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 2 : Property Listing
        |--------------------------------------------------------------------------
        */

        const [property] = await pool.query(
            `
    SELECT id
    FROM properties
    WHERE vendor_id = ?
    LIMIT 1
    `,
            [vendorId]
        );

        if (property.length === 0) {
            return res.status(200).json({
                success: true,
                currentStep: 2,
                step: "listing",
                redirect: "/vendor/setup/listing",
            });
        }

        const propertyId = property[0].id;

        /*
        |--------------------------------------------------------------------------
        | Check Listing Progress
        |--------------------------------------------------------------------------
        */

        const [listingProgress] = await pool.query(
            `
            SELECT
                completed_percentage,
                is_completed
            FROM property_listing_progress
            WHERE property_id = ?
            LIMIT 1
            `,
            [propertyId]
        );

        if (
            listingProgress.length === 0 ||
            listingProgress[0].completed_percentage < 100 ||
            listingProgress[0].is_completed === 0
        ) {
            return res.status(200).json({
                success: true,
                currentStep: 2,
                step: "listing",
                propertyId,
                redirect: "/vendor/setup/listing",
            });
        }
        /*
        |--------------------------------------------------------------------------
        | STEP 3 : Property Documents
        |--------------------------------------------------------------------------
        */

        // Replace property_documents with your actual documents table
        // const [documents] = await pool.query(
        //     `SELECT id
        //      FROM property_documents
        //      WHERE property_id = ?
        //      LIMIT 1`,
        //     [propertyId]
        // );

        // if (documents.length === 0) {
        //     return res.status(200).json({
        //         success: true,
        //         currentStep: 3,
        //         step: "documents",
        //         propertyId,
        //         redirect: "/vendor/setup/documents",
        //     });
        // }

        /*
        |--------------------------------------------------------------------------
        | COMPLETED
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,
            currentStep: 4,
            step: "completed",
            propertyId,
            redirect: "/vendor/dashboard",
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

// export const getVendorProperties = async (req, res) => {
//     try {
//         const vendorId = req.user.id;
//         const [rows] = await pool.execute(
//             `
//             SELECT
//                 p.id,
//                 p.property_name,
//                 p.slug,
//                 p.status,
//                 p.min_price,
//                 p.max_price,
//                 p.created_at,

//                 pt.name AS property_type,

//                 pa.city,
//                 pa.state,

//                 img.image AS cover_image,

//                 prog.current_step,
//                 prog.completed_percentage,
//                 prog.is_completed

//             FROM properties p

//             LEFT JOIN property_types pt
//             ON pt.id = p.property_type_id

//             LEFT JOIN property_addresses pa
//             ON pa.property_id = p.id

//             LEFT JOIN property_listing_progress prog
//             ON prog.property_id = p.id

//             LEFT JOIN property_images img
//             ON img.property_id = p.id
//             AND img.is_cover = 1
//             WHERE p.vendor_id = ?
//             ORDER BY p.id DESC
//             `,
//             [vendorId]
//         );
//         return res.json({
//             success: true,
//             data: rows
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


export const getVendorProperties = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const [properties] = await pool.execute(
            `
            SELECT

                p.id,
                p.property_name,
                p.slug,
                p.description,
                p.status,
                p.star_rating,
                p.total_rooms,
                p.min_price,
                p.max_price,
                p.is_featured,
                p.created_at,
                p.updated_at,

                pt.name AS property_type,

                pa.city,
                pa.state,
                pa.country,

                prog.current_step,
                prog.completed_percentage,
                prog.is_completed

            FROM properties p

            LEFT JOIN property_types pt
                ON pt.id = p.property_type_id

            LEFT JOIN property_addresses pa
                ON pa.property_id = p.id

            LEFT JOIN property_listing_progress prog
                ON prog.property_id = p.id

            WHERE p.vendor_id=?
            ORDER BY p.updated_at DESC
            `,
            [vendorId]
        );
        // Attach Images

        for (const property of properties) {
            const [images] = await pool.execute(
                `
                SELECT
                    id,
                    image,
                    is_cover,
                    sort_order
                FROM property_images
                WHERE property_id=?
                ORDER BY
                    is_cover DESC,
                    sort_order ASC

                LIMIT 4
                `,
                [property.id]
            );
            property.cover_image =
                images.find(img => img.is_cover === 1)?.image ||
                images[0]?.image ||
                null;
            property.preview_images = images;
            property.total_images = images.length;
        }
        return res.json({
            success: true,
            data: properties
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// export const getPropertyDetails = async (req, res) => {

//     try {
//         const vendorId = req.vendor.id;
//         const { id } = req.params;
//         const [property] = await pool.execute(
//             `
//             SELECT *
//             FROM properties
//             WHERE id=?
//             AND vendor_id=?
//             `,
//             [
//                 id,
//                 vendorId
//             ]
//         );
//         if(property.length===0){
//             return res.status(404).json({
//                 success:false,
//                 message:"Property not found."
//             });
//         }
//         const propertyId=id;
//         const [address]=await pool.execute(
//             `SELECT *
//              FROM property_addresses
//              WHERE property_id=?`,

//             [
//                 propertyId
//             ]
//         );
//         const [images]=await pool.execute(
//             `SELECT *
//              FROM property_images
//              WHERE property_id=?
//              ORDER BY sort_order ASC`,

//             [
//                 propertyId
//             ]
//         );
//         const [amenities]=await pool.execute(
//             `
//             SELECT amenity_id
//             FROM property_amenities
//             WHERE property_id=?
//             `,
//             [
//                 propertyId
//             ]
//         );
//         const [policies]=await pool.execute(
//             `
//             SELECT *
//             FROM property_policies
//             WHERE property_id=?
//             `,
//             [
//                 propertyId
//             ]
//         );

//         const [rules]=await pool.execute(
//             `
//             SELECT *
//             FROM property_rules
//             WHERE property_id=?
//             `,
//             [
//                 propertyId
//             ]
//         );
//         const [rooms]=await pool.execute(
//             `
//             SELECT *
//             FROM rooms
//             WHERE property_id=?
//             `,

//             [
//                 propertyId
//             ]
//         );
//         // Attach related room data
//         for(const room of rooms){
//             const [roomImages]=await pool.execute(
//                 `
//                 SELECT *
//                 FROM room_images
//                 WHERE room_id=?
//                 `,
//                 [
//                     room.id
//                 ]
//             );
//             const [beds]=await pool.execute(
//                 `
//                 SELECT *
//                 FROM room_beds
//                 WHERE room_id=?
//                 `,
//                 [
//                     room.id
//                 ]
//             );
//             const [dormBeds]=await pool.execute(
//                 `
//                 SELECT *
//                 FROM room_dorm_beds
//                 WHERE room_id=?
//                 `,
//                 [
//                     room.id
//                 ]
//             );
//             const [price]=await pool.execute(
//                 `
//                 SELECT *
//                 FROM room_prices
//                 WHERE room_id=?
//                 LIMIT 1
//                 `,
//                 [
//                     room.id
//                 ]
//             );
//             const [availability]=await pool.execute(
//                 `
//                 SELECT *
//                 FROM room_availability
//                 WHERE room_id=?
//                 `,
//                 [
//                     room.id
//                 ]
//             );
//             room.images = roomImages;
//             room.beds = beds;
//             room.dorm_beds = dormBeds;
//             room.price = price[0] || null;
//             room.availability = availability;
//         }
//         return res.json({
//             success:true,
//             property:property[0],
//             address:address[0] || null,
//             images,
//             amenities,
//             policies:policies[0] || null,
//             rules:rules[0] || null,
//             rooms
//         });
//     }catch(error){
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         });
//     }
// };


export const getPropertyDetails = async (req, res) => {

    try {
        const vendorId = req.vendor.id;
        const { id } = req.params;
        const [property] = await pool.execute(
            `
            SELECT *
            FROM properties
            WHERE id=?
            AND vendor_id=?
            `,
            [
                id,
                vendorId
            ]
        );
        if (property.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found."
            });
        }
        const propertyId = id;
        const [address] = await pool.execute(
            `SELECT *
             FROM property_addresses
             WHERE property_id=?`,

            [
                propertyId
            ]
        );
        const [images] = await pool.execute(
            `SELECT *
             FROM property_images
             WHERE property_id=?
             ORDER BY sort_order ASC`,

            [
                propertyId
            ]
        );

        // Join property_amenities -> amenities to get real names/icons in one query
        const [amenities] = await pool.execute(
            `
            SELECT a.id, a.name, a.icon
            FROM property_amenities pa
            INNER JOIN amenities a ON a.id = pa.amenity_id
            WHERE pa.property_id=?
            AND a.status=1
            `,
            [
                propertyId
            ]
        );

        const [policies] = await pool.execute(
            `
            SELECT *
            FROM property_policies
            WHERE property_id=?
            `,
            [
                propertyId
            ]
        );

        const [rulesRows] = await pool.execute(
            `
            SELECT *
            FROM property_rules
            WHERE property_id=?
            `,
            [
                propertyId
            ]
        );

        // property_rules is a flags table (smoking_allowed, pets_allowed, etc.),
        // not a lookup table like amenities, so we expand the booleans into
        // a readable list instead of joining against a "real rules" table.
        const RULE_LABELS = {
            smoking_allowed: "Smoking",
            pets_allowed: "Pets",
            parties_allowed: "Parties / Events",
            couples_allowed: "Couples",
            children_allowed: "Children"
        };

        let rules = [];
        if (rulesRows.length > 0) {
            const row = rulesRows[0];
            rules = Object.keys(RULE_LABELS)
                .filter((key) => row[key] !== null && row[key] !== undefined)
                .map((key) => ({
                    key,
                    label: RULE_LABELS[key],
                    allowed: !!row[key]
                }));
        }

        const [rooms] = await pool.execute(
            `
            SELECT *
            FROM rooms
            WHERE property_id=?
            `,

            [
                propertyId
            ]
        );
        // Attach related room data
        for (const room of rooms) {
            const [roomImages] = await pool.execute(
                `
                SELECT *
                FROM room_images
                WHERE room_id=?
                `,
                [
                    room.id
                ]
            );
            const [beds] = await pool.execute(
                `
                SELECT *
                FROM room_beds
                WHERE room_id=?
                `,
                [
                    room.id
                ]
            );
            const [dormBeds] = await pool.execute(
                `
                SELECT *
                FROM room_dorm_beds
                WHERE room_id=?
                `,
                [
                    room.id
                ]
            );
            const [price] = await pool.execute(
                `
                SELECT *
                FROM room_prices
                WHERE room_id=?
                LIMIT 1
                `,
                [
                    room.id
                ]
            );
            const [availability] = await pool.execute(
                `
                SELECT *
                FROM room_availability
                WHERE room_id=?
                `,
                [
                    room.id
                ]
            );
            room.images = roomImages;
            room.beds = beds;
            room.dorm_beds = dormBeds;
            room.price = price[0] || null;
            room.availability = availability;
        }
        return res.json({
            success: true,
            property: property[0],
            address: address[0] || null,
            images,
            amenities,
            policies: policies[0] || null,
            rules,
            rooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



export const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to logout."
                });
            }
            res.clearCookie("vendor.sid");
            return res.status(200).json({
                success: true,
                message: "Logout successful."
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};