import pool from "../../config/db.js";
/**
 * Search destinations (public, no auth) — powers the guest search bar's
 * "Where to?" autocomplete. Matches against city/state/country names and
 * also against any property whose area/city matches, so a guest typing
 * a neighbourhood still gets somewhere useful.
 */
export const searchDestinations = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        if (q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }
        const like = `%${q}%`;

        const [cityRows] = await pool.query(
            `
            SELECT DISTINCT
                ci.name  AS city,
                st.name  AS state,
                co.name  AS country,
                ci.latitude,
                ci.longitude
            FROM cities ci
            JOIN states st ON st.id = ci.state_id
            JOIN countries co ON co.id = ci.country_id
            WHERE ci.status = 1 AND ci.name LIKE ?
            ORDER BY ci.name ASC
            LIMIT 8
            `,
            [like]
        );

        const [propertyAreaRows] = await pool.query(
            `
            SELECT DISTINCT pa.city, pa.state, pa.country
            FROM property_addresses pa
            JOIN properties p ON p.id = pa.property_id
            WHERE p.status = 'approved'
              AND (pa.city LIKE ? OR pa.area LIKE ?)
            LIMIT 8
            `,
            [like, like]
        );

        const seen = new Set();
        const results = [];
        for (const r of [...cityRows, ...propertyAreaRows]) {
            const key = `${r.city}|${r.state}|${r.country}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({
                label: [r.city, r.state, r.country].filter(Boolean).join(", "),
                city: r.city,
                state: r.state,
                country: r.country,
                latitude: r.latitude ?? null,
                longitude: r.longitude ?? null,
            });
        }

        return res.status(200).json({ success: true, data: results.slice(0, 8) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * Get All Countries
 */
export const getCountries = async (req, res) => {
    try {
        const [countries] = await pool.query(`
            SELECT
                id,
                name,
                iso2,
                phone_code
            FROM countries
            WHERE status = 1
            ORDER BY name ASC
        `);

        return res.status(200).json({
            success: true,
            message: "Countries fetched successfully.",
            data: countries
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


/**
 * Get States By Country
 */
export const getStates = async (req, res) => {
    try {

        const { country_id } = req.params;

        const [states] = await pool.query(`
            SELECT
                id,
                name,
                state_code
            FROM states
            WHERE country_id = ?
            AND status = 1
            ORDER BY name ASC
        `, [country_id]);

        return res.status(200).json({
            success: true,
            message: "States fetched successfully.",
            data: states
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


/**
 * Get Cities By State
 */
export const getCities = async (req, res) => {
    try {

        const { state_id } = req.params;

        const [cities] = await pool.query(`
            SELECT
                id,
                name,
                latitude,
                longitude
            FROM cities
            WHERE state_id = ?
            AND status = 1
            ORDER BY name ASC
        `, [state_id]);

        return res.status(200).json({
            success: true,
            message: "Cities fetched successfully.",
            data: cities
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


/**
 * Get Complete Address Hierarchy
 */
export const getLocationHierarchy = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT

                c.id AS country_id,
                c.name AS country_name,

                s.id AS state_id,
                s.name AS state_name,

                ct.id AS city_id,
                ct.name AS city_name

            FROM countries c

            LEFT JOIN states s
            ON s.country_id = c.id

            LEFT JOIN cities ct
            ON ct.state_id = s.id

            WHERE
                c.status = 1
                AND s.status = 1
                AND ct.status = 1

            ORDER BY
                c.name,
                s.name,
                ct.name
        `);

        return res.status(200).json({
            success: true,
            message: "Locations fetched successfully.",
            data: rows
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


export const saveVendorAddress = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const {
            business_name,
            contact_person,
            address_line_1,
            address_line_2,
            landmark,
            country_id,
            state_id,
            city_id,
            postal_code,
            latitude,
            longitude,
        } = req.body;

        // Validation
        if (
            !business_name ||
            !address_line_1 ||
            !country_id ||
            !state_id ||
            !city_id ||
            !postal_code
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        // Check if address already exists
        const [existing] = await pool.query(
            `SELECT id FROM vendor_addresses WHERE vendor_id = ? LIMIT 1`,
            [vendorId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Vendor address already exists.",
            });
        }

        // Insert address
        await pool.query(
            `
            INSERT INTO vendor_addresses
            (
                vendor_id,
                business_name,
                contact_person,
                address_line_1,
                address_line_2,
                landmark,
                country_id,
                state_id,
                city_id,
                postal_code,
                latitude,
                longitude
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                vendorId,
                business_name,
                contact_person,
                address_line_1,
                address_line_2,
                landmark,
                country_id,
                state_id,
                city_id,
                postal_code,
                latitude || null,
                longitude || null,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Vendor address saved successfully.",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};