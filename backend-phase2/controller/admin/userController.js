import pool from "../../config/db.js";



export const getUserList = async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT u.*, 
            COUNT(b.id) as total_bookings,
            COALESCE(SUM(b.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
        `;
        let params = [];

        if (search) {
            // Apply multi-filter if search query exists
            query += ` WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?`;
            const searchTerm = `%${search}%`;
            params = [searchTerm, searchTerm, searchTerm, searchTerm];
        } else {
            // Default: Show only users created in the current month (July 2026)
            query += ` WHERE MONTH(u.created_at) = MONTH(CURRENT_DATE()) 
                       AND YEAR(u.created_at) = YEAR(CURRENT_DATE())`;
        }

        query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

        const [users] = await pool.execute(query, params);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch User and their total booking count using a JOIN or Subquery
        const userQuery = `
            SELECT u.*, 
            (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as total_bookings
            FROM users u 
            WHERE u.id = ?
        `;

        // 2. Fetch specific booking history
        const bookingsQuery = `
            SELECT b.id, b.booking_number, b.check_in_date, b.total_amount, b.booking_status, p.property_name 
            FROM bookings b
            JOIN properties p ON b.property_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `;

        const [userRows] = await pool.execute(userQuery, [id]);
        const [bookingRows] = await pool.execute(bookingsQuery, [id]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: userRows[0],
            bookings: bookingRows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update user basic details (first_name, last_name, email, phone, status).
 * PUT /api/admin/users/:id
 */
export const updateBasicUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, status } = req.body;

        const updateQuery = `
            UPDATE users 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, status = ?
            WHERE id = ?
        `;

        const [result] = await pool.execute(updateQuery, [first_name, last_name, email, phone, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found or no changes made" });
        }

        res.status(200).json({ success: true, message: "User profile updated successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
