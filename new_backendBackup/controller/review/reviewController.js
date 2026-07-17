import pool from "../../config/db.js";

export const    createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            booking_id,
            rating,
            review,
            title
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
            `SELECT *
    FROM bookings
    WHERE id=?
    AND user_id=?
    LIMIT 1`
            , [booking_id, userId]);
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
            `SELECT id
    FROM property_reviews
    WHERE booking_id=?`
            , [booking_id]);
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
        booking_id,
        property_id,
        user_id,
        rating,
        title,
        review,
        status
    )
    VALUES(?,?,?,?,?,?,?)`
            , [
                booking_id,
                book.property_id,
                userId,
                rating,
                title || null,
                review,
                "approved"
            ]);
        const reviewId = insert.insertId;
        //-------------------------------------
        // Upload Images
        //-------------------------------------
        if (req.files && req.files.length) {
            for (const img of req.files) {
                await pool.query(
                    `INSERT INTO property_review_images(
                review_id,
                image
            )
            VALUES(?,?)`
                    , [
                        reviewId,
                        img.filename
                    ]);
            }
        }
        //-------------------------------------
        // Update Property Rating
        //-------------------------------------

        const [avg] = await pool.query(
            `SELECT
    ROUND(AVG(rating),1) averageRating,
    COUNT(*) totalReviews
    FROM property_reviews
    WHERE property_id=?
    AND status='approved'`
            , [book.property_id]);
        await pool.query(
            `UPDATE properties
    SET
    average_rating=?,
    total_reviews=?
    WHERE id=?`
            , [
                avg[0].averageRating,
                avg[0].totalReviews,
                book.property_id
            ]);
        return res.json({
            success: true,
            message: "Review submitted"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}