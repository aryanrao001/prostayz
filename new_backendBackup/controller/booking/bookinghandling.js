// controllers/bookingController.js

import pool from '../../config/db.js';
import {
  getNightsList,
  calculateRoomStayPrice,
  aggregateBookingTotals,
  generateBookingNumber,
} from '../../utils/pricing.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Checks whether `quantity` rooms/beds are available for the full date range.
 * Looks at rooms.available_rooms as the baseline and room_availability for
 * per-date overrides (blocked_rooms reduces what's bookable that night).
 */
async function assertAvailability(conn, { room, nightsList, quantity, dormBedId }) {
  if (dormBedId) {
    const [[bed]] = await conn.query(
      `SELECT status FROM room_dorm_beds WHERE id = ? AND room_id = ? FOR UPDATE`,
      [dormBedId, room.id]
    );
    if (!bed) throw httpError(404, 'Dorm bed not found for this room');
    if (bed.status !== 'available') throw httpError(409, 'Selected dorm bed is not available');
    return; // dorm beds are booked individually, no per-night quantity math needed
  }

  // Lock the room row so two concurrent bookings can't both pass the check
  const [[freshRoom]] = await conn.query(
    `SELECT available_rooms FROM rooms WHERE id = ? FOR UPDATE`,
    [room.id]
  );
  if (!freshRoom) throw httpError(404, 'Room not found');

  const [overrides] = await conn.query(
    `SELECT available_date, available_rooms, blocked_rooms
       FROM room_availability
      WHERE room_id = ? AND available_date IN (?)`,
    [room.id, nightsList]
  );
  const overrideMap = new Map(overrides.map((o) => [o.available_date, o]));

  for (const date of nightsList) {
    const override = overrideMap.get(date);
    const availableThatNight = override
      ? (override.available_rooms ?? freshRoom.available_rooms) - (override.blocked_rooms || 0)
      : freshRoom.available_rooms;

    if (availableThatNight < quantity) {
      throw httpError(409, `Only ${Math.max(availableThatNight, 0)} room(s) left on ${date}`);
    }
  }
}







// Future Refrence 


// async function assertNoWholePropertyConflict(conn, { propertyId, roomCategory, nightsList }) {
//   const checkIn = nightsList[0];
//   const checkOutDate = new Date(nightsList[nightsList.length - 1]);
//   checkOutDate.setDate(checkOutDate.getDate() + 1);
//   const checkOut = checkOutDate.toISOString().slice(0, 10);

//   if (roomCategory === 'whole_property') {
//     // Booking the whole property → no other booking of ANY room may overlap
//     const [conflicts] = await conn.query(
//       `SELECT b.id FROM bookings b
//         WHERE b.property_id = ?
//           AND b.booking_status NOT IN ('cancelled', 'no_show')
//           AND b.check_in_date < ? AND b.check_out_date > ?
//         LIMIT 1`,
//       [propertyId, checkOut, checkIn]
//     );
//     if (conflicts.length) {
//       throw httpError(409, 'Property already has bookings for these dates — cannot book whole property');
//     }
//   } else {
//     // Booking a single room → block if the property is already booked whole
//     const [conflicts] = await conn.query(
//       `SELECT b.id FROM bookings b
//          JOIN booking_rooms br ON br.booking_id = b.id
//          JOIN rooms r ON r.id = br.room_id
//         WHERE b.property_id = ?
//           AND r.room_category = 'whole_property'
//           AND b.booking_status NOT IN ('cancelled', 'no_show')
//           AND b.check_in_date < ? AND b.check_out_date > ?
//         LIMIT 1`,
//       [propertyId, checkOut, checkIn]
//     );
//     if (conflicts.length) {
//       throw httpError(409, 'Property is booked out entirely for these dates');
//     }
//   }
// }













async function decrementAvailability(conn, { room, nightsList, quantity, dormBedId }) {
  if (dormBedId) {
    await conn.query(`UPDATE room_dorm_beds SET status = 'blocked' WHERE id = ?`, [dormBedId]);
    return;
  }
  await conn.query(`UPDATE rooms SET available_rooms = available_rooms - ? WHERE id = ?`, [
    quantity,
    room.id,
  ]);
  // Upsert per-date blocked_rooms so calendar views stay accurate
  for (const date of nightsList) {
    await conn.query(
      `INSERT INTO room_availability (room_id, available_date, available_rooms, blocked_rooms)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE blocked_rooms = blocked_rooms + VALUES(blocked_rooms)`,
      [room.id, date, room.available_rooms, quantity]
    );
  }
}

async function restoreAvailability(conn, booking) {
  const [rooms] = await conn.query(
    `SELECT br.room_id, br.dorm_bed_id, br.quantity, b.check_in_date, b.check_out_date
       FROM booking_rooms br
       JOIN bookings b ON b.id = br.booking_id
      WHERE br.booking_id = ?`,
    [booking.id]
  );

  for (const row of rooms) {
    if (row.dorm_bed_id) {
      await conn.query(`UPDATE room_dorm_beds SET status = 'available' WHERE id = ?`, [
        row.dorm_bed_id,
      ]);
      continue;
    }
    await conn.query(`UPDATE rooms SET available_rooms = available_rooms + ? WHERE id = ?`, [
      row.quantity,
      row.room_id,
    ]);
    const nights = getNightsList(row.check_in_date, row.check_out_date);
    if (nights.length) {
      await conn.query(
        `UPDATE room_availability
            SET blocked_rooms = GREATEST(blocked_rooms - ?, 0)
          WHERE room_id = ? AND available_date IN (?)`,
        [row.quantity, row.room_id, nights]
      );
    }
  }
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* ------------------------------------------------------------------ */
/* POST /bookings — create a booking                                   */
/* ------------------------------------------------------------------ */
/**
 * Expected body:
 * {
 *   propertyId, roomId, dormBedId?, quantity, checkInDate, checkOutDate,
 *   adults, children, contactName, contactPhone, contactEmail,
 *   specialRequests, discountAmount?
 * }
 * req.user.id must be set by your auth middleware (JWT for app users).
 */
export const createBooking = async (req, res, next) => {
  const {
    propertyId,
    roomId,
    dormBedId,
    quantity = 1,
    checkInDate,
    checkOutDate,
    adults = 1,
    children = 0,
    contactName,
    contactPhone,
    contactEmail,
    specialRequests,
    discountAmount = 0,
  } = req.body;

  if (!propertyId || !roomId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ success: false, message: 'Missing required booking fields' });
  }
  if (new Date(checkOutDate) <= new Date(checkInDate)) {
    return res.status(400).json({ success: false, message: 'check_out_date must be after check_in_date' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[property]] = await conn.query(
      `SELECT id, vendor_id, status FROM properties WHERE id = ?`,
      [propertyId]
    );
    if (!property || property.status !== 'approved') {
      throw httpError(404, 'Property not found or not bookable');
    }

    const [[room]] = await conn.query(
      `SELECT * FROM rooms WHERE id = ? AND property_id = ?`,
      [roomId, propertyId]
    );
    if (!room) throw httpError(404, 'Room not found for this property');

    const [[roomPrice]] = await conn.query(`SELECT * FROM room_prices WHERE room_id = ?`, [roomId]);
    if (!roomPrice) throw httpError(422, 'Room has no pricing configured');

    if (room.room_category === 'dorm' && !dormBedId) {
      throw httpError(400, 'dormBedId is required for dorm rooms');
    }

    const nightsList = getNightsList(checkInDate, checkOutDate);

    await assertAvailability(conn, { room, nightsList, quantity, dormBedId });

    let priceBreakdown;
    if (dormBedId) {
      const [[bed]] = await conn.query(`SELECT price FROM room_dorm_beds WHERE id = ?`, [dormBedId]);
      const subtotal = Number(bed.price) * nightsList.length;
      const taxAmount = +(subtotal * (Number(roomPrice.tax || 0) / 100)).toFixed(2);
      priceBreakdown = { subtotal, extraGuestAmount: 0, taxAmount, quantity: 1 };
    } else {
      const [overrides] = await conn.query(
        `SELECT available_date, special_price FROM room_availability WHERE room_id = ? AND available_date IN (?)`,
        [roomId, nightsList]
      );
      const overrideMap = new Map(overrides.map((o) => [o.available_date, o]));
      const perRoom = calculateRoomStayPrice({
        roomPrice,
        room,
        nightsList,
        adults,
        availabilityOverrides: overrideMap,
      });
      priceBreakdown = { ...perRoom, quantity };
    }

    const totals = aggregateBookingTotals([priceBreakdown], discountAmount);
    const bookingNumber = generateBookingNumber();

    const [bookingResult] = await conn.query(
      `INSERT INTO bookings
        (booking_number, user_id, property_id, vendor_id, check_in_date, check_out_date,
         nights, adults, children, subtotal, tax_amount, extra_guest_amount, discount_amount,
         total_amount, currency, booking_status, payment_status,
         contact_name, contact_phone, contact_email, special_requests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'pending', 'pending', ?, ?, ?, ?)`,
      [
        bookingNumber,
        req.user.id,
        propertyId,
        property.vendor_id,
        checkInDate,
        checkOutDate,
        nightsList.length,
        adults,
        children,
        totals.subtotal,
        totals.taxAmount,
        totals.extraGuestAmount,
        totals.discountAmount,
        totals.totalAmount,
        contactName,
        contactPhone,
        contactEmail,
        specialRequests || null,
      ]
    );

    const bookingId = bookingResult.insertId;

    await conn.query(
      `INSERT INTO booking_rooms
        (booking_id, room_id, dorm_bed_id, quantity, room_price, extra_guest_price, tax)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        roomId,
        dormBedId || null,
        priceBreakdown.quantity,
        priceBreakdown.subtotal,
        priceBreakdown.extraGuestAmount,
        priceBreakdown.taxAmount,
      ]
    );

    await decrementAvailability(conn, { room, nightsList, quantity, dormBedId });

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Booking created, awaiting payment',
      data: { bookingId, bookingNumber, ...totals },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* ------------------------------------------------------------------ */
/* GET /bookings/:id                                                   */
/* ------------------------------------------------------------------ */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[booking]] = await pool.query(
      `SELECT b.*, p.property_name, p.slug
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE b.id = ?`,
      [id]
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Scope: users can only see their own booking, vendors only their property's booking
    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (req.user.role === 'vendor' && booking.vendor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [rooms] = await pool.query(
      `SELECT br.*, r.room_name, r.room_type, rdb.bed_label
         FROM booking_rooms br
         JOIN rooms r ON r.id = br.room_id
         LEFT JOIN room_dorm_beds rdb ON rdb.id = br.dorm_bed_id
        WHERE br.booking_id = ?`,
      [id]
    );

    const [payments] = await pool.query(
      `SELECT id, amount, payment_type, payment_method, transaction_id, status, paid_at, created_at
         FROM booking_payments WHERE booking_id = ? ORDER BY created_at DESC`,
      [id]
    );

    res.json({ success: true, data: { ...booking, rooms, payments } });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /bookings/me — logged-in user's bookings                        */
/* ------------------------------------------------------------------ */
// export const getUserBookings = async (req, res, next) => {
//   try {
//     const { status } = req.query;
//     const params = [req.user.id];
//     let where = 'b.user_id = ?';
//     if (status) {
//       where += ' AND b.booking_status = ?';
//       params.push(status);
//     }
//     const [rows] = await pool.query(
//       `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.total_amount,
//               b.booking_status, b.payment_status, p.property_name, p.slug,
//               (SELECT image FROM property_images WHERE property_id = p.id AND is_cover = 1 LIMIT 1) AS cover_image
//          FROM bookings b
//          JOIN properties p ON p.id = b.property_id
//         WHERE ${where}
//         ORDER BY b.created_at DESC`,
//       params
//     );
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };


/* ------------------------------------------------------------------ */
/* GET /bookings/me — logged-in user's bookings                        */
/* Replaces the existing getUserBookings in bookingController.js       */
/* ------------------------------------------------------------------ */
export const getUserBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [req.user.id];
    let where = 'b.user_id = ?';
    if (status) {
      where += ' AND b.booking_status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.nights,
              b.adults, b.children, b.total_amount, b.currency,
              b.booking_status, b.payment_status, b.created_at,
              p.id AS property_id, p.property_name, p.slug,
              pa.city, pa.area,
              (SELECT image FROM property_images WHERE property_id = p.id AND is_cover = 1 LIMIT 1) AS cover_image,
              (SELECT r.room_name FROM booking_rooms br
                 JOIN rooms r ON r.id = br.room_id
                WHERE br.booking_id = b.id LIMIT 1) AS room_name,
              (SELECT r.room_category FROM booking_rooms br
                 JOIN rooms r ON r.id = br.room_id
                WHERE br.booking_id = b.id LIMIT 1) AS room_category,
              (SELECT rdb.bed_label FROM booking_rooms br
                 LEFT JOIN room_dorm_beds rdb ON rdb.id = br.dorm_bed_id
                WHERE br.booking_id = b.id LIMIT 1) AS bed_label
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         LEFT JOIN property_addresses pa ON pa.property_id = p.id
        WHERE ${where}
        ORDER BY b.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /bookings/vendor — bookings for the logged-in vendor's properties*/
/* ------------------------------------------------------------------ */
// export const getVendorBookings = async (req, res, next) => {
//   try {
//     const { status, propertyId } = req.query;
//     const params = [req.vendor.id];
//     let where = 'b.vendor_id = ?';
//     if (status) {
//       where += ' AND b.booking_status = ?';
//       params.push(status);
//     }
//     if (propertyId) {
//       where += ' AND b.property_id = ?';
//       params.push(propertyId);
//     }
//     const [rows] = await pool.query(
//       `SELECT b.*, p.property_name
//          FROM bookings b
//          JOIN properties p ON p.id = b.property_id
//         WHERE ${where}
//         ORDER BY b.created_at DESC`,
//       params
//     );
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };


export const getVendorBookings = async (req, res, next) => {
  try {
    const { status, propertyId } = req.query;
    const params = [req.vendor.id];
    let where = 'b.vendor_id = ?';
    if (status) { where += ' AND b.booking_status = ?'; params.push(status); }
    if (propertyId) { where += ' AND b.property_id = ?'; params.push(propertyId); }

    const [bookings] = await pool.query(
      `SELECT b.*, p.property_name, p.slug,
              u.first_name AS user_first_name, u.last_name AS user_last_name,
              u.phone AS user_phone, u.email AS user_email
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN users u ON u.id = b.user_id
        WHERE ${where}
        ORDER BY b.created_at DESC`,
      params
    );
    if (!bookings.length) return res.json({ success: true, data: [] });

    const bookingIds = bookings.map((b) => b.id);

    const [rooms] = await pool.query(
      `SELECT br.booking_id, br.room_id, br.dorm_bed_id, br.quantity,
              br.room_price, br.extra_guest_price, br.tax,
              r.room_name, r.room_type, r.room_category,
              rdb.bed_label, rdb.bed_type
         FROM booking_rooms br
         JOIN rooms r ON r.id = br.room_id
         LEFT JOIN room_dorm_beds rdb ON rdb.id = br.dorm_bed_id
        WHERE br.booking_id IN (?)`,
      [bookingIds]
    );

    const [payments] = await pool.query(
      `SELECT booking_id, id, amount, payment_type, payment_method, transaction_id, status, paid_at, created_at
         FROM booking_payments
        WHERE booking_id IN (?)
        ORDER BY created_at DESC`,
      [bookingIds]
    );

    const roomsByBooking = new Map();
    rooms.forEach((r) => {
      if (!roomsByBooking.has(r.booking_id)) roomsByBooking.set(r.booking_id, []);
      roomsByBooking.get(r.booking_id).push(r);
    });
    const paymentsByBooking = new Map();
    payments.forEach((p) => {
      if (!paymentsByBooking.has(p.booking_id)) paymentsByBooking.set(p.booking_id, []);
      paymentsByBooking.get(p.booking_id).push(p);
    });

    const data = bookings.map((b) => ({
      ...b,
      rooms: roomsByBooking.get(b.id) || [],   // tells vendor: room name, category (whole_property or not), bed label if dorm
      payments: paymentsByBooking.get(b.id) || [], // tells vendor: how much, how paid, when
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /admin/bookings — global list with filters + pagination         */
/* ------------------------------------------------------------------ */
// export const getAllBookingsAdmin = async (req, res, next) => {
//   try {
//     const { status, paymentStatus, from, to, page = 1, limit = 20 } = req.query;
//     const params = [];
//     const clauses = [];

//     if (status) { clauses.push('b.booking_status = ?'); params.push(status); }
//     if (paymentStatus) { clauses.push('b.payment_status = ?'); params.push(paymentStatus); }
//     if (from) { clauses.push('b.check_in_date >= ?'); params.push(from); }
//     if (to) { clauses.push('b.check_out_date <= ?'); params.push(to); }

//     const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
//     const offset = (Number(page) - 1) * Number(limit);

//     const [rows] = await pool.query(
//       `SELECT b.*, p.property_name, u.first_name AS user_first_name, u.phone AS user_phone
//          FROM bookings b
//          JOIN properties p ON p.id = b.property_id
//          JOIN users u ON u.id = b.user_id
//          ${where}
//         ORDER BY b.created_at DESC
//         LIMIT ? OFFSET ?`,
//       [...params, Number(limit), offset]
//     );

//     const [[{ total }]] = await pool.query(
//       `SELECT COUNT(*) AS total FROM bookings b ${where}`,
//       params
//     );

//     res.json({ success: true, data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
//   } catch (err) {
//     next(err);
//   }
// };

/* ------------------------------------------------------------------ */
/* PATCH /bookings/:id/status — confirm / check-in / check-out / no-show*/
/* ------------------------------------------------------------------ */
// const ALLOWED_TRANSITIONS = {
//   pending: ['confirmed', 'cancelled'],
//   confirmed: ['checked_in', 'cancelled', 'no_show'],
//   checked_in: ['checked_out'],
//   checked_out: [],
//   cancelled: [],
//   no_show: [],
// };

// export const updateBookingStatus = async (req, res, next) => {
//   const { id } = req.params;
//   const { status } = req.body; // target booking_status

//   try {
//     const [[booking]] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [id]);
//     if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

//     if (req.user.role === 'vendor' && booking.vendor_id !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Forbidden' });
//     }

//     const allowedNext = ALLOWED_TRANSITIONS[booking.booking_status] || [];
//     if (!allowedNext.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot move booking from '${booking.booking_status}' to '${status}'`,
//       });
//     }

//     await pool.query(`UPDATE bookings SET booking_status = ? WHERE id = ?`, [status, id]);
//     res.json({ success: true, message: `Booking marked as ${status}` });
//   } catch (err) {
//     next(err);
//   }
// };
// import pool from "../config/db.js";
const ALLOWED_BOOKING_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

const ALLOWED_PAYMENT_STATUS = [
  "pending",
  "paid",
  "partially_paid",
  "refunded",
  "failed",
];

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { booking_status, payment_status } = req.body;

    console.log("Request Body:", req.body);

    const [[booking]] = await pool.query(
      "SELECT * FROM bookings WHERE id = ? LIMIT 1",
      [id]
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    let finalBookingStatus = booking.booking_status;
    let finalPaymentStatus = booking.payment_status;

    // ------------------------------
    // Booking Status Validation
    // ------------------------------

    if (
      booking_status &&
      booking_status !== booking.booking_status
    ) {
      const allowedTransitions =
        ALLOWED_BOOKING_TRANSITIONS[booking.booking_status] || [];

      console.log("Current:", booking.booking_status);
      console.log("Requested:", booking_status);
      console.log("Allowed:", allowedTransitions);

      if (!allowedTransitions.includes(booking_status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move booking from '${booking.booking_status}' to '${booking_status}'.`,
        });
      }

      finalBookingStatus = booking_status;
    }

    // ------------------------------
    // Payment Status Validation
    // ------------------------------

    if (payment_status) {
      if (!ALLOWED_PAYMENT_STATUS.includes(payment_status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      finalPaymentStatus = payment_status;
    }

    // ------------------------------
    // Cancel Logic
    // ------------------------------

    let cancelled_at = booking.cancelled_at;
    let cancelled_by = booking.cancelled_by;

    if (
      finalBookingStatus === "cancelled" &&
      booking.booking_status !== "cancelled"
    ) {
      cancelled_at = new Date();
      cancelled_by = "admin";
    }

    if (finalBookingStatus !== "cancelled") {
      cancelled_at = null;
      cancelled_by = null;
    }

    // ------------------------------
    // Update
    // ------------------------------

    await pool.query(
      `
      UPDATE bookings
      SET
        booking_status = ?,
        payment_status = ?,
        cancelled_at = ?,
        cancelled_by = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        finalBookingStatus,
        finalPaymentStatus,
        cancelled_at,
        cancelled_by,
        id,
      ]
    );

    const [[updatedBooking]] = await pool.query(
      "SELECT * FROM bookings WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: updatedBooking,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* POST /bookings/:id/cancel                                           */
/* ------------------------------------------------------------------ */
export const cancelBooking = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const cancelledBy = req.user.role; // 'user' | 'vendor' | 'admin'

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[booking]] = await conn.query(`SELECT * FROM bookings WHERE id = ? FOR UPDATE`, [id]);
    if (!booking) throw httpError(404, 'Booking not found');

    if (cancelledBy === 'user' && booking.user_id !== req.user.id) {
      throw httpError(403, 'Forbidden');
    }
    if (['cancelled', 'checked_out', 'no_show'].includes(booking.booking_status)) {
      throw httpError(400, `Booking already ${booking.booking_status}, cannot cancel`);
    }

    await conn.query(
      `UPDATE bookings
          SET booking_status = 'cancelled',
              cancellation_reason = ?,
              cancelled_at = NOW(),
              cancelled_by = ?
        WHERE id = ?`,
      [reason || null, cancelledBy, id]
    );

    await restoreAvailability(conn, booking);

    // If money was actually captured, log a refund record (gateway call happens outside this transaction)
    if (booking.payment_status === 'paid' || booking.payment_status === 'partially_paid') {
      await conn.query(
        `INSERT INTO booking_payments (booking_id, amount, payment_type, status)
         VALUES (?, ?, 'refund', 'initiated')`,
        [id, booking.total_amount]
      );
      await conn.query(`UPDATE bookings SET payment_status = 'refunded' WHERE id = ?`, [id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* ------------------------------------------------------------------ */
/* Payments                                                             */
/* ------------------------------------------------------------------ */

/** POST /bookings/:id/payments/initiate — create a pending payment attempt */
export const initiatePayment = async (req, res, next) => {
  const { id } = req.params;
  const { paymentMethod, paymentType = 'full' } = req.body;

  try {
    const [[booking]] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [id]);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    const amount = paymentType === 'advance' ? +(booking.total_amount * 0.2).toFixed(2) : booking.total_amount;

    const [result] = await pool.query(
      `INSERT INTO booking_payments (booking_id, amount, payment_type, payment_method, status)
       VALUES (?, ?, ?, ?, 'initiated')`,
      [id, amount, paymentType, paymentMethod || null]
    );

    // In production: call your payment gateway here (Razorpay/Stripe order creation)
    // and return the gateway order id/client secret alongside paymentId.
    res.status(201).json({ success: true, data: { paymentId: result.insertId, amount } });
  } catch (err) {
    next(err);
  }
};

/** POST /bookings/payments/:paymentId/confirm — webhook or client confirm callback */
export const confirmPayment = async (req, res, next) => {
  const { paymentId } = req.params;
  const { transactionId, status } = req.body; // status: 'success' | 'failed'

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[payment]] = await conn.query(
      `SELECT * FROM booking_payments WHERE id = ? FOR UPDATE`,
      [paymentId]
    );
    if (!payment) throw httpError(404, 'Payment not found');

    await conn.query(
      `UPDATE booking_payments
          SET status = ?, transaction_id = ?, paid_at = IF(? = 'success', NOW(), NULL)
        WHERE id = ?`,
      [status, transactionId || null, status, paymentId]
    );

    if (status === 'success') {
      const [[booking]] = await conn.query(`SELECT * FROM bookings WHERE id = ?`, [payment.booking_id]);
      const [[{ paidTotal }]] = await conn.query(
        `SELECT COALESCE(SUM(amount), 0) AS paidTotal
           FROM booking_payments WHERE booking_id = ? AND payment_type != 'refund' AND status = 'success'`,
        [payment.booking_id]
      );

      const newPaymentStatus = paidTotal >= booking.total_amount ? 'paid' : 'partially_paid';
      const newBookingStatus = booking.booking_status === 'pending' ? 'confirmed' : booking.booking_status;

      await conn.query(
        `UPDATE bookings SET payment_status = ?, booking_status = ? WHERE id = ?`,
        [newPaymentStatus, newBookingStatus, payment.booking_id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: `Payment ${status}` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};



export const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      from,
      to,
      vendorId,
      propertyId,
      search, // matches booking_number, guest name, guest phone
      page = 1,
      limit = 20,
    } = req.query;

    const params = [];
    const clauses = [];

    if (status) { clauses.push('b.booking_status = ?'); params.push(status); }
    if (paymentStatus) { clauses.push('b.payment_status = ?'); params.push(paymentStatus); }
    if (from) { clauses.push('b.check_in_date >= ?'); params.push(from); }
    if (to) { clauses.push('b.check_out_date <= ?'); params.push(to); }
    if (vendorId) { clauses.push('b.vendor_id = ?'); params.push(vendorId); }
    if (propertyId) { clauses.push('b.property_id = ?'); params.push(propertyId); }
    if (search) {
      clauses.push(
        '(b.booking_number LIKE ? OR u.first_name LIKE ? OR b.contact_name LIKE ? OR b.contact_phone LIKE ? OR u.phone LIKE ?)'
      );
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `SELECT b.*, p.property_name, p.slug,
              u.first_name AS user_first_name, u.last_name AS user_last_name,
              u.phone AS user_phone, u.email AS user_email,
              v.business_name AS vendor_business_name,
              v.first_name AS vendor_first_name, v.last_name AS vendor_last_name,
              v.phone AS vendor_phone
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN users u ON u.id = b.user_id
         JOIN vendors v ON v.id = b.vendor_id
         ${where}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM bookings b
         JOIN users u ON u.id = b.user_id
         ${where}`,
      params
    );

    let data = rows;
    if (rows.length) {
      const bookingIds = rows.map((b) => b.id);

      const [rooms] = await pool.query(
        `SELECT br.booking_id, br.room_id, br.dorm_bed_id, br.quantity,
                br.room_price, br.extra_guest_price, br.tax,
                r.room_name, r.room_type, r.room_category,
                rdb.bed_label, rdb.bed_type
           FROM booking_rooms br
           JOIN rooms r ON r.id = br.room_id
           LEFT JOIN room_dorm_beds rdb ON rdb.id = br.dorm_bed_id
          WHERE br.booking_id IN (?)`,
        [bookingIds]
      );

      const [payments] = await pool.query(
        `SELECT booking_id, id, amount, payment_type, payment_method, transaction_id, status, paid_at, created_at
           FROM booking_payments
          WHERE booking_id IN (?)
          ORDER BY created_at DESC`,
        [bookingIds]
      );

      const roomsByBooking = new Map();
      rooms.forEach((r) => {
        if (!roomsByBooking.has(r.booking_id)) roomsByBooking.set(r.booking_id, []);
        roomsByBooking.get(r.booking_id).push(r);
      });
      const paymentsByBooking = new Map();
      payments.forEach((p) => {
        if (!paymentsByBooking.has(p.booking_id)) paymentsByBooking.set(p.booking_id, []);
        paymentsByBooking.get(p.booking_id).push(p);
      });

      data = rows.map((b) => ({
        ...b,
        rooms: roomsByBooking.get(b.id) || [],
        payments: paymentsByBooking.get(b.id) || [],
      }));
    }

    res.json({
      success: true,
      data,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};