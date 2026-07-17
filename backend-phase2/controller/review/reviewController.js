import pool from "../../config/db.js";

/* ============================================================
   POST /review/create  (user, after checkout)
============================================================ */
export const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            booking_id,
            rating,
            cleanliness_rating,
            accuracy_rating,
            value_rating,
            review,
            title,
            is_anonymous
        } = req.body;

        if (!booking_id || !rating || !review) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating should be between 1-5"
            });
        }
        //-------------------------------------
        // Check Booking
        //-------------------------------------
        const [booking] = await pool.query(
            `SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1`,
            [booking_id, userId]
        );
        if (!booking.length) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        const book = booking[0];
        if (book.booking_status != "checked_out") {
            return res.status(400).json({
                success: false,
                message: "Review allowed after checkout only"
            });
        }
        //-------------------------------------
        // Already Reviewed?
        //-------------------------------------
        const [exists] = await pool.query(
            `SELECT id FROM property_reviews WHERE booking_id=?`,
            [booking_id]
        );
        if (exists.length) {
            return res.status(400).json({
                success: false,
                message: "Review already submitted"
            });
        }
        //-------------------------------------
        // Insert Review
        //-------------------------------------
        const [insert] = await pool.query(
            `INSERT INTO property_reviews(
                booking_id, property_id, user_id, rating,
                cleanliness_rating, accuracy_rating, value_rating,
                title, review, is_anonymous, status
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                booking_id,
                book.property_id,
                userId,
                rating,
                cleanliness_rating || null,
                accuracy_rating || null,
                value_rating || null,
                title || null,
                review,
                is_anonymous ? 1 : 0,
                "approved"
            ]
        );
        const reviewId = insert.insertId;
        //-------------------------------------
        // Upload Images
        //-------------------------------------
        if (req.files && req.files.length) {
            for (const img of req.files) {
                await pool.query(
                    `INSERT INTO property_review_images(review_id, image) VALUES(?,?)`,
                    [reviewId, img.filename]
                );
            }
        }
        //-------------------------------------
        // Update Property Rating
        //-------------------------------------
        await recalculatePropertyRating(book.property_id);

        return res.status(201).json({
            success: true,
            message: "Review submitted",
            data: { id: reviewId }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* ============================================================
   Shared helper — recompute a property's average_rating/total_reviews
============================================================ */
async function recalculatePropertyRating(propertyId) {
    const [avg] = await pool.query(
        `SELECT ROUND(AVG(rating),1) averageRating, COUNT(*) totalReviews
         FROM property_reviews WHERE property_id=? AND status='approved'`,
        [propertyId]
    );
    await pool.query(
        `UPDATE properties SET average_rating=?, total_reviews=? WHERE id=?`,
        [avg[0].averageRating || 0, avg[0].totalReviews || 0, propertyId]
    );
}

/* ============================================================
   GET /review/property/:propertyId  (public — property details page)
   Returns paginated approved reviews + a rating breakdown.
============================================================ */
export const getPropertyReviews = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const [reviews] = await pool.query(
            `SELECT
                r.id, r.rating, r.cleanliness_rating, r.accuracy_rating, r.value_rating,
                r.title, r.review, r.vendor_reply, r.vendor_reply_at,
                r.is_anonymous, r.created_at,
                CASE WHEN r.is_anonymous = 1 THEN 'Guest' ELSE u.first_name END AS reviewer_first_name,
                CASE WHEN r.is_anonymous = 1 THEN NULL ELSE u.profile_image END AS reviewer_image
             FROM property_reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.property_id = ? AND r.status = 'approved'
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [propertyId, limit, offset]
        );

        if (reviews.length) {
            const ids = reviews.map((r) => r.id);
            const [images] = await pool.query(
                `SELECT review_id, image FROM property_review_images WHERE review_id IN (?)`,
                [ids]
            );
            const byReview = new Map();
            images.forEach((img) => {
                if (!byReview.has(img.review_id)) byReview.set(img.review_id, []);
                byReview.get(img.review_id).push(img.image);
            });
            reviews.forEach((r) => { r.images = byReview.get(r.id) || []; });
        }

        const [[summary]] = await pool.query(
            `SELECT
                COUNT(*) AS total,
                ROUND(AVG(rating),2) AS average_rating,
                ROUND(AVG(cleanliness_rating),2) AS avg_cleanliness,
                ROUND(AVG(accuracy_rating),2) AS avg_accuracy,
                ROUND(AVG(value_rating),2) AS avg_value,
                SUM(rating = 5) AS five_star,
                SUM(rating = 4) AS four_star,
                SUM(rating = 3) AS three_star,
                SUM(rating = 2) AS two_star,
                SUM(rating = 1) AS one_star
             FROM property_reviews WHERE property_id = ? AND status = 'approved'`,
            [propertyId]
        );

        return res.json({
            success: true,
            data: reviews,
            summary,
            pagination: { page, limit, total: summary.total, totalPages: Math.ceil(summary.total / limit) || 1 }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   GET /review/reviewable  (user) — checked-out bookings with no review yet
   Powers the "Write a review" prompt after checkout.
============================================================ */
export const getReviewableBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            `SELECT b.id AS booking_id, b.booking_number, b.check_out_date,
                    p.id AS property_id, p.property_name, p.slug,
                    (SELECT image FROM property_images WHERE property_id = p.id AND is_cover = 1 LIMIT 1) AS cover_image
             FROM bookings b
             JOIN properties p ON p.id = b.property_id
             LEFT JOIN property_reviews r ON r.booking_id = b.id
             WHERE b.user_id = ? AND b.booking_status = 'checked_out' AND r.id IS NULL
             ORDER BY b.check_out_date DESC`,
            [userId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   GET /review/mine  (user) — reviews the logged-in user has written
============================================================ */
export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            `SELECT r.*, p.property_name, p.slug
             FROM property_reviews r
             JOIN properties p ON p.id = r.property_id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   POST /review/:id/reply  (vendor) — reply to a review on their property
============================================================ */
export const replyToReview = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const { id } = req.params;
        const { reply } = req.body;

        if (!reply || !reply.trim()) {
            return res.status(400).json({ success: false, message: "Reply text is required" });
        }

        const [rows] = await pool.query(
            `SELECT r.id, p.vendor_id
             FROM property_reviews r
             JOIN properties p ON p.id = r.property_id
             WHERE r.id = ? LIMIT 1`,
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        if (rows[0].vendor_id !== vendorId) {
            return res.status(403).json({ success: false, message: "This review is not on your property" });
        }

        await pool.query(
            `UPDATE property_reviews SET vendor_reply = ?, vendor_reply_at = NOW() WHERE id = ?`,
            [reply.trim(), id]
        );

        return res.json({ success: true, message: "Reply posted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   Admin moderation
============================================================ */

// GET /review/admin/all?status=pending
export const getAllReviewsAdmin = async (req, res) => {
    try {
        const { status } = req.query;
        const params = [];
        let where = "";
        if (status) {
            where = "WHERE r.status = ?";
            params.push(status);
        }
        const [rows] = await pool.query(
            `SELECT r.*, p.property_name, u.first_name, u.last_name, u.phone
             FROM property_reviews r
             JOIN properties p ON p.id = r.property_id
             JOIN users u ON u.id = r.user_id
             ${where}
             ORDER BY r.created_at DESC`,
            params
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /review/admin/:id/status  { status: 'approved' | 'rejected' }
export const moderateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const [[review]] = await pool.query(`SELECT * FROM property_reviews WHERE id = ?`, [id]);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });

        await pool.query(`UPDATE property_reviews SET status = ? WHERE id = ?`, [status, id]);
        await recalculatePropertyRating(review.property_id);

        return res.json({ success: true, message: `Review ${status}` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /review/admin/:id
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const [[review]] = await pool.query(`SELECT * FROM property_reviews WHERE id = ?`, [id]);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });

        await pool.query(`DELETE FROM property_review_images WHERE review_id = ?`, [id]);
        await pool.query(`DELETE FROM property_reviews WHERE id = ?`, [id]);
        await recalculatePropertyRating(review.property_id);

        return res.json({ success: true, message: "Review deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
