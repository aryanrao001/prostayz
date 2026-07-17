// admin.analytics.controller.js
// -----------------------------------------------------------------------------
// Single "God" controller for the Admin Panel — Dashboard / Vendors / Properties
// / Bookings / Users analytics. ES6 modules. Raw SQL via mysql2/promise pool.
//
// Import the pool from wherever you already configure it, e.g.:
//   import mysql from 'mysql2/promise';
//   const pool = mysql.createPool({ host, user, password, database, waitForConnections:true, connectionLimit:10 });
//   export default pool;
// -----------------------------------------------------------------------------

import pool from "../../config/db.js";

// import pool from '../config/db.js'; // <-- adjust path to your actual db pool file

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

/** Standard success response */
const ok = (res, data, meta = {}) => res.status(200).json({ success: true, data, meta });

/** Standard error response */
const fail = (res, err, code = 500) => {
  console.error('[AdminAnalytics] Error:', err);
  return res.status(code).json({ success: false, message: err?.message || 'Something went wrong' });
};

/** Parse pagination params safely */
const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/** Whitelist a sort column against an allowed map, fallback to default */
const getSort = (req, allowedMap, defaultKey) => {
  const key = allowedMap[req.query.sort_by] ? req.query.sort_by : defaultKey;
  const order = (req.query.sort_order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `${allowedMap[key]} ${order}`;
};

/** Push a WHERE condition + param only if the query value is present */
const addFilter = (conditions, params, condition, value) => {
  if (value !== undefined && value !== null && value !== '') {
    conditions.push(condition);
    params.push(value);
  }
};

/** date_trunc-ish grouping expression for MySQL/MariaDB, used in trend charts */
const groupByExpr = (column, granularity) => {
  switch (granularity) {
    case 'month':
      return `DATE_FORMAT(${column}, '%Y-%m-01')`;
    case 'week':
      return `DATE_SUB(DATE(${column}), INTERVAL WEEKDAY(${column}) DAY)`;
    case 'day':
    default:
      return `DATE(${column})`;
  }
};

// =============================================================================
// 1) DASHBOARD OVERVIEW  ->  GET /admin/analytics/dashboard
//    Optional filters: start_date, end_date (applies to bookings-based figures)
// =============================================================================
export const getDashboardOverview = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const bookingDateConditions = [];
    const bookingDateParams = [];
    addFilter(bookingDateConditions, bookingDateParams, 'created_at >= ?', start_date);
    addFilter(bookingDateConditions, bookingDateParams, 'created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    const bookingDateWhere = bookingDateConditions.length ? `AND ${bookingDateConditions.join(' AND ')}` : '';

    const [[counts]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM vendors) AS total_vendors,
        (SELECT COUNT(*) FROM vendors WHERE status = 'active') AS active_vendors,
        (SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pending_vendors,
        (SELECT COUNT(*) FROM vendors WHERE status = 'blocked') AS blocked_vendors,

        (SELECT COUNT(*) FROM properties) AS total_properties,
        (SELECT COUNT(*) FROM properties WHERE status = 'approved') AS approved_properties,
        (SELECT COUNT(*) FROM properties WHERE status = 'pending') AS pending_properties,
        (SELECT COUNT(*) FROM properties WHERE status = 'draft') AS draft_properties,
        (SELECT COUNT(*) FROM properties WHERE status = 'rejected') AS rejected_properties,
        (SELECT COUNT(*) FROM properties WHERE is_featured = 1) AS featured_properties,

        (SELECT COUNT(*) FROM rooms) AS total_rooms,
        (SELECT COALESCE(SUM(available_rooms),0) FROM rooms) AS total_available_rooms,

        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
        (SELECT COUNT(*) FROM users WHERE status = 'blocked') AS blocked_users,

        (SELECT COUNT(*) FROM bookings WHERE 1=1 ${bookingDateWhere}) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'pending' ${bookingDateWhere}) AS pending_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'confirmed' ${bookingDateWhere}) AS confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'checked_in' ${bookingDateWhere}) AS checked_in_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'checked_out' ${bookingDateWhere}) AS checked_out_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'cancelled' ${bookingDateWhere}) AS cancelled_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = 'no_show' ${bookingDateWhere}) AS no_show_bookings,

        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status = 'paid' ${bookingDateWhere}) AS total_revenue,
        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status = 'pending' ${bookingDateWhere}) AS pending_payment_amount,
        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE booking_status = 'cancelled' ${bookingDateWhere}) AS revenue_lost_to_cancellations,
        (SELECT COALESCE(AVG(total_amount),0) FROM bookings WHERE 1=1 ${bookingDateWhere}) AS avg_booking_value
      `,
      [...bookingDateParams, ...bookingDateParams, ...bookingDateParams, ...bookingDateParams,
       ...bookingDateParams, ...bookingDateParams, ...bookingDateParams,
       ...bookingDateParams, ...bookingDateParams, ...bookingDateParams]
    );

    // cancellation rate is a small derived metric, computed here rather than SQL for clarity
    const cancellationRate = counts.total_bookings > 0
      ? Number(((counts.cancelled_bookings / counts.total_bookings) * 100).toFixed(2))
      : 0;

    // Top 5 cities by property count (quick widget)
    const [topCities] = await pool.query(
      `SELECT pa.city, pa.state, COUNT(*) AS property_count
       FROM property_addresses pa
       GROUP BY pa.city, pa.state
       ORDER BY property_count DESC
       LIMIT 5`
    );

    // Recent bookings (quick widget)
    const [recentBookings] = await pool.query(
      `SELECT b.id, b.booking_number, b.booking_status, b.payment_status, b.total_amount,
              b.check_in_date, b.check_out_date, b.created_at,
              p.property_name, CONCAT(v.first_name, ' ', v.last_name) AS vendor_name,
              b.contact_name AS guest_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       LEFT JOIN vendors v ON v.id = b.vendor_id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    return ok(res, { counts, cancellation_rate: cancellationRate, top_cities: topCities, recent_bookings: recentBookings });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 2) VENDORS REPORT (list)  ->  GET /admin/analytics/vendors
//    Filters: status, search, city, has_properties, start_date, end_date, page, limit, sort_by, sort_order
// =============================================================================
export const getVendorsReport = async (req, res) => {
  try {
    const { status, search, city, start_date, end_date } = req.query;
    const { page, limit, offset } = getPagination(req);

    const conditions = ['1=1'];
    const params = [];

    addFilter(conditions, params, 'v.status = ?', status);
    addFilter(conditions, params, 'v.created_at >= ?', start_date);
    addFilter(conditions, params, 'v.created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    addFilter(conditions, params, 'c.name = ?', city);
    if (search) {
      conditions.push('(v.business_name LIKE ? OR v.first_name LIKE ? OR v.last_name LIKE ? OR v.email LIKE ? OR v.phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const sortMap = {
      created_at: 'v.created_at',
      business_name: 'v.business_name',
      total_properties: 'total_properties',
      total_bookings: 'total_bookings',
      total_revenue: 'total_revenue',
      cancelled_bookings: 'cancelled_bookings',
    };
    const orderBy = getSort(req, sortMap, 'created_at');

    const [rows] = await pool.query(
      `SELECT
         v.id, v.first_name, v.last_name, v.business_name, v.email, v.phone,
         v.country_code, v.status, v.last_login_at, v.created_at,
         c.name AS city, s.name AS state,
         COUNT(DISTINCT p.id) AS total_properties,
         COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) AS approved_properties,
         COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) AS pending_properties,
         COUNT(DISTINCT CASE WHEN p.status = 'draft' THEN p.id END) AS draft_properties,
         COUNT(DISTINCT b.id) AS total_bookings,
         COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.id END) AS cancelled_bookings,
         COUNT(DISTINCT CASE WHEN b.booking_status = 'confirmed' THEN b.id END) AS confirmed_bookings,
         COUNT(DISTINCT CASE WHEN b.booking_status = 'checked_out' THEN b.id END) AS completed_bookings,
         COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS total_revenue
       FROM vendors v
       LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
       LEFT JOIN cities c ON c.id = va.city_id
       LEFT JOIN states s ON s.id = va.state_id
       LEFT JOIN properties p ON p.vendor_id = v.id
       LEFT JOIN bookings b ON b.vendor_id = v.id
       WHERE ${whereClause}
       GROUP BY v.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT v.id) AS total
       FROM vendors v
       LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
       LEFT JOIN cities c ON c.id = va.city_id
       WHERE ${whereClause}`,
      params
    );

    return ok(res, rows, { page, limit, total, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 3) VENDOR DETAILS  ->  GET /admin/analytics/vendors/:vendorId
//    Query filters (for the bookings sub-list): status, start_date, end_date, page, limit
// =============================================================================
export const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, start_date, end_date } = req.query;
    const { page, limit, offset } = getPagination(req);

    const [[vendor]] = await pool.query(
      `SELECT v.*, va.business_name AS registered_business_name, va.address_line_1, va.address_line_2,
              va.landmark, va.postal_code, c.name AS city, s.name AS state, co.name AS country
       FROM vendors v
       LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
       LEFT JOIN cities c ON c.id = va.city_id
       LEFT JOIN states s ON s.id = va.state_id
       LEFT JOIN countries co ON co.id = va.country_id
       WHERE v.id = ?`,
      [vendorId]
    );

    if (!vendor) return fail(res, new Error('Vendor not found'), 404);
    delete vendor.password;
    delete vendor.remember_token;
    delete vendor.otp;

    // Properties owned by this vendor
    const [properties] = await pool.query(
      `SELECT p.id, p.property_name, p.slug, p.status, p.star_rating, p.total_rooms,
              p.min_price, p.max_price, p.is_featured, p.created_at,
              pi.image AS cover_image,
              COUNT(DISTINCT b.id) AS total_bookings,
              COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.id END) AS cancelled_bookings,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
       FROM properties p
       LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_cover = 1
       LEFT JOIN bookings b ON b.property_id = p.id
       WHERE p.vendor_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [vendorId]
    );

    // Booking stats summary for this vendor
    const [[bookingStats]] = await pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) AS pending_bookings,
         COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
         COUNT(CASE WHEN booking_status = 'checked_in' THEN 1 END) AS checked_in_bookings,
         COUNT(CASE WHEN booking_status = 'checked_out' THEN 1 END) AS checked_out_bookings,
         COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
         COUNT(CASE WHEN booking_status = 'no_show' THEN 1 END) AS no_show_bookings,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_revenue,
         COALESCE(AVG(total_amount), 0) AS avg_booking_value
       FROM bookings WHERE vendor_id = ?`,
      [vendorId]
    );

    // Filtered / paginated booking list for this vendor
    const conditions = ['b.vendor_id = ?'];
    const params = [vendorId];
    addFilter(conditions, params, 'b.booking_status = ?', status);
    addFilter(conditions, params, 'b.check_in_date >= ?', start_date);
    addFilter(conditions, params, 'b.check_in_date <= ?', end_date);
    const whereClause = conditions.join(' AND ');

    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.nights,
              b.total_amount, b.booking_status, b.payment_status, b.contact_name,
              b.contact_phone, b.created_at, p.property_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total: bookingTotal }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b WHERE ${whereClause}`,
      params
    );

    // Monthly revenue/booking trend, last 12 months
    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COUNT(*) AS bookings_count,
              COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) AS cancelled_count,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue
       FROM bookings
       WHERE vendor_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [vendorId]
    );

    return ok(res, {
      vendor,
      properties,
      booking_stats: bookingStats,
      bookings,
      monthly_trend: monthlyTrend,
    }, { page, limit, total: bookingTotal, total_pages: Math.ceil(bookingTotal / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 4) PROPERTIES REPORT (list)  ->  GET /admin/analytics/properties
//    Filters: vendor_id, status, property_type_id, city, search, min_price, max_price,
//             is_featured, page, limit, sort_by, sort_order
// =============================================================================
export const getPropertiesReport = async (req, res) => {
  try {
    const {
      vendor_id, status, property_type_id, city, search,
      min_price, max_price, is_featured,
    } = req.query;
    const { page, limit, offset } = getPagination(req);

    const conditions = ['1=1'];
    const params = [];

    addFilter(conditions, params, 'p.vendor_id = ?', vendor_id);
    addFilter(conditions, params, 'p.status = ?', status);
    addFilter(conditions, params, 'p.property_type_id = ?', property_type_id);
    addFilter(conditions, params, 'pa.city = ?', city);
    addFilter(conditions, params, 'p.min_price >= ?', min_price);
    addFilter(conditions, params, 'p.max_price <= ?', max_price);
    addFilter(conditions, params, 'p.is_featured = ?', is_featured);
    if (search) {
      conditions.push('(p.property_name LIKE ? OR p.slug LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }

    const whereClause = conditions.join(' AND ');

    const sortMap = {
      created_at: 'p.created_at',
      property_name: 'p.property_name',
      total_bookings: 'total_bookings',
      revenue: 'revenue',
      star_rating: 'p.star_rating',
    };
    const orderBy = getSort(req, sortMap, 'created_at');

    const [rows] = await pool.query(
      `SELECT
         p.id, p.property_name, p.slug, p.status, p.star_rating, p.total_rooms,
         p.min_price, p.max_price, p.is_featured, p.created_at,
         pt.name AS property_type, CONCAT(v.first_name, ' ', v.last_name) AS vendor_name,
         v.id AS vendor_id, v.business_name,
         pa.city, pa.state,
         pi.image AS cover_image,
         COUNT(DISTINCT r.id) AS room_types_count,
         COUNT(DISTINCT b.id) AS total_bookings,
         COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.id END) AS cancelled_bookings,
         COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
       FROM properties p
       LEFT JOIN property_types pt ON pt.id = p.property_type_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       LEFT JOIN property_addresses pa ON pa.property_id = p.id
       LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_cover = 1
       LEFT JOIN rooms r ON r.property_id = p.id
       LEFT JOIN bookings b ON b.property_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) AS total
       FROM properties p
       LEFT JOIN property_addresses pa ON pa.property_id = p.id
       WHERE ${whereClause}`,
      params
    );

    return ok(res, rows, { page, limit, total, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 5) PROPERTY DETAILS  ->  GET /admin/analytics/properties/:propertyId
// =============================================================================
export const getPropertyDetails = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, start_date, end_date } = req.query;
    const { page, limit, offset } = getPagination(req);

    const [[property]] = await pool.query(
      `SELECT p.*, pt.name AS property_type_name,
              CONCAT(v.first_name, ' ', v.last_name) AS vendor_name, v.business_name, v.email AS vendor_email,
              pa.country, pa.state, pa.city, pa.area, pa.address, pa.pincode, pa.landmark,
              pp.cancellation_policy, pp.house_rules, pp.refund_policy,
              pr.smoking_allowed, pr.pets_allowed, pr.parties_allowed, pr.couples_allowed, pr.children_allowed
       FROM properties p
       LEFT JOIN property_types pt ON pt.id = p.property_type_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       LEFT JOIN property_addresses pa ON pa.property_id = p.id
       LEFT JOIN property_policies pp ON pp.property_id = p.id
       LEFT JOIN property_rules pr ON pr.property_id = p.id
       WHERE p.id = ?`,
      [propertyId]
    );
    if (!property) return fail(res, new Error('Property not found'), 404);

    const [images] = await pool.query(
      `SELECT id, image, is_cover, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC`,
      [propertyId]
    );

    const [amenities] = await pool.query(
      `SELECT a.id, a.name, a.icon FROM property_amenities pa
       JOIN amenities a ON a.id = pa.amenity_id
       WHERE pa.property_id = ?`,
      [propertyId]
    );

    const [rooms] = await pool.query(
      `SELECT r.id, r.room_name, r.room_type, r.room_category, r.max_adults, r.max_children,
              r.total_rooms, r.available_rooms, r.room_size, r.room_size_unit,
              rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax,
              ri.image AS cover_image,
              COUNT(DISTINCT br.id) AS times_booked
       FROM rooms r
       LEFT JOIN room_prices rp ON rp.room_id = r.id
       LEFT JOIN room_images ri ON ri.room_id = r.id AND ri.is_cover = 1
       LEFT JOIN booking_rooms br ON br.room_id = r.id
       WHERE r.property_id = ?
       GROUP BY r.id`,
      [propertyId]
    );

    // Booking stats summary
    const [[bookingStats]] = await pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) AS pending_bookings,
         COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
         COUNT(CASE WHEN booking_status = 'checked_in' THEN 1 END) AS checked_in_bookings,
         COUNT(CASE WHEN booking_status = 'checked_out' THEN 1 END) AS checked_out_bookings,
         COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_revenue,
         COALESCE(AVG(total_amount), 0) AS avg_booking_value
       FROM bookings WHERE property_id = ?`,
      [propertyId]
    );

    const conditions = ['b.property_id = ?'];
    const params = [propertyId];
    addFilter(conditions, params, 'b.booking_status = ?', status);
    addFilter(conditions, params, 'b.check_in_date >= ?', start_date);
    addFilter(conditions, params, 'b.check_in_date <= ?', end_date);
    const whereClause = conditions.join(' AND ');

    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.nights, b.adults, b.children,
              b.total_amount, b.booking_status, b.payment_status, b.contact_name, b.contact_phone,
              b.cancellation_reason, b.cancelled_at, b.cancelled_by, b.created_at
       FROM bookings b
       WHERE ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total: bookingTotal }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b WHERE ${whereClause}`,
      params
    );

    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COUNT(*) AS bookings_count,
              COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) AS cancelled_count,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue
       FROM bookings
       WHERE property_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [propertyId]
    );

    return ok(res, {
      property, images, amenities, rooms,
      booking_stats: bookingStats,
      bookings,
      monthly_trend: monthlyTrend,
    }, { page, limit, total: bookingTotal, total_pages: Math.ceil(bookingTotal / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 6) BOOKINGS REPORT (list)  ->  GET /admin/analytics/bookings
//    Filters: booking_status, payment_status, vendor_id, property_id, user_id,
//             start_date, end_date (on check_in_date), search, page, limit, sort_by, sort_order
// =============================================================================
export const getBookingsReport = async (req, res) => {
  try {
    const {
      booking_status, payment_status, vendor_id, property_id, user_id,
      start_date, end_date, search,
    } = req.query;
    const { page, limit, offset } = getPagination(req);

    const conditions = ['1=1'];
    const params = [];

    addFilter(conditions, params, 'b.booking_status = ?', booking_status);
    addFilter(conditions, params, 'b.payment_status = ?', payment_status);
    addFilter(conditions, params, 'b.vendor_id = ?', vendor_id);
    addFilter(conditions, params, 'b.property_id = ?', property_id);
    addFilter(conditions, params, 'b.user_id = ?', user_id);
    addFilter(conditions, params, 'b.check_in_date >= ?', start_date);
    addFilter(conditions, params, 'b.check_in_date <= ?', end_date);
    if (search) {
      conditions.push('(b.booking_number LIKE ? OR b.contact_name LIKE ? OR b.contact_phone LIKE ? OR b.contact_email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const sortMap = {
      created_at: 'b.created_at',
      check_in_date: 'b.check_in_date',
      total_amount: 'b.total_amount',
      booking_status: 'b.booking_status',
    };
    const orderBy = getSort(req, sortMap, 'created_at');

    const [rows] = await pool.query(
      `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.nights,
              b.adults, b.children, b.subtotal, b.tax_amount, b.discount_amount, b.total_amount,
              b.currency, b.booking_status, b.payment_status, b.contact_name, b.contact_phone,
              b.contact_email, b.cancellation_reason, b.cancelled_at, b.cancelled_by, b.created_at,
              p.property_name, CONCAT(v.first_name, ' ', v.last_name) AS vendor_name,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name,'')) AS user_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       LEFT JOIN vendors v ON v.id = b.vendor_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b WHERE ${whereClause}`,
      params
    );

    // Summary strip for the same filter set (useful for cards above the table)
    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
         COUNT(CASE WHEN b.booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
         COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS total_revenue
       FROM bookings b WHERE ${whereClause}`,
      params
    );

    return ok(res, rows, { page, limit, total, total_pages: Math.ceil(total / limit), summary });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 7) BOOKING DETAILS  ->  GET /admin/analytics/bookings/:bookingId
// =============================================================================
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [[booking]] = await pool.query(
      `SELECT b.*, p.property_name, p.slug,
              CONCAT(v.first_name, ' ', v.last_name) AS vendor_name, v.business_name, v.email AS vendor_email,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name,'')) AS user_name, u.email AS user_email
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       LEFT JOIN vendors v ON v.id = b.vendor_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`,
      [bookingId]
    );
    if (!booking) return fail(res, new Error('Booking not found'), 404);

    const [rooms] = await pool.query(
      `SELECT br.id, br.quantity, br.room_price, br.extra_guest_price, br.tax,
              r.room_name, r.room_type, rdb.bed_label
       FROM booking_rooms br
       LEFT JOIN rooms r ON r.id = br.room_id
       LEFT JOIN room_dorm_beds rdb ON rdb.id = br.dorm_bed_id
       WHERE br.booking_id = ?`,
      [bookingId]
    );

    const [payments] = await pool.query(
      `SELECT id, amount, payment_type, payment_method, transaction_id, status, paid_at, created_at
       FROM booking_payments WHERE booking_id = ? ORDER BY created_at DESC`,
      [bookingId]
    );

    return ok(res, { booking, rooms, payments });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 8) USERS REPORT (list)  ->  GET /admin/analytics/users
//    Filters: status, search, start_date, end_date, page, limit, sort_by, sort_order
// =============================================================================
export const getUsersReport = async (req, res) => {
  try {
    const { status, search, start_date, end_date } = req.query;
    const { page, limit, offset } = getPagination(req);

    const conditions = ['1=1'];
    const params = [];
    addFilter(conditions, params, 'u.status = ?', status);
    addFilter(conditions, params, 'u.created_at >= ?', start_date);
    addFilter(conditions, params, 'u.created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    if (search) {
      conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    const whereClause = conditions.join(' AND ');

    const sortMap = {
      created_at: 'u.created_at',
      total_bookings: 'total_bookings',
      total_spent: 'total_spent',
    };
    const orderBy = getSort(req, sortMap, 'created_at');

    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status,
              u.email_verified, u.phone_verified, u.last_login_at, u.created_at,
              COUNT(DISTINCT b.id) AS total_bookings,
              COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.id END) AS cancelled_bookings,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS total_spent,
              COUNT(DISTINCT w.id) AS wishlist_count
       FROM users u
       LEFT JOIN bookings b ON b.user_id = u.id
       LEFT JOIN wishlists w ON w.user_id = u.id
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}`,
      params
    );

    return ok(res, rows, { page, limit, total, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 9) USER DETAILS  ->  GET /admin/analytics/users/:userId
// =============================================================================
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, offset } = getPagination(req);

    const [[user]] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) return fail(res, new Error('User not found'), 404);
    delete user.password;

    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
         COUNT(CASE WHEN booking_status = 'checked_out' THEN 1 END) AS completed_bookings,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_spent
       FROM bookings WHERE user_id = ?`,
      [userId]
    );

    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_number, b.check_in_date, b.check_out_date, b.total_amount,
              b.booking_status, b.payment_status, b.created_at, p.property_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM bookings WHERE user_id = ?`, [userId]);

    const [wishlist] = await pool.query(
      `SELECT w.id, w.created_at, p.id AS property_id, p.property_name, pi.image AS cover_image
       FROM wishlists w
       LEFT JOIN properties p ON p.id = w.property_id
       LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_cover = 1
       WHERE w.user_id = ?`,
      [userId]
    );

    return ok(res, { user, stats, bookings, wishlist }, { page, limit, total, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 10) REVENUE / BOOKING TREND CHART  ->  GET /admin/analytics/charts/trend
//     Filters: granularity(day|week|month, default day), start_date, end_date,
//              vendor_id, property_id
// =============================================================================
export const getBookingRevenueTrend = async (req, res) => {
  try {
    const { granularity = 'day', start_date, end_date, vendor_id, property_id } = req.query;

    const conditions = ['1=1'];
    const params = [];
    addFilter(conditions, params, 'b.created_at >= ?', start_date);
    addFilter(conditions, params, 'b.created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    addFilter(conditions, params, 'b.vendor_id = ?', vendor_id);
    addFilter(conditions, params, 'b.property_id = ?', property_id);
    const whereClause = conditions.join(' AND ');

    const bucket = groupByExpr('b.created_at', granularity);

    const [rows] = await pool.query(
      `SELECT ${bucket} AS period,
              COUNT(*) AS total_bookings,
              COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
              COUNT(CASE WHEN b.booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
       FROM bookings b
       WHERE ${whereClause}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );

    return ok(res, rows);
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 11) BOOKING STATUS / PAYMENT STATUS DISTRIBUTION  ->  GET /admin/analytics/charts/status-distribution
//     For pie/donut charts. Filters: start_date, end_date, vendor_id, property_id
// =============================================================================
export const getStatusDistribution = async (req, res) => {
  try {
    const { start_date, end_date, vendor_id, property_id } = req.query;

    const conditions = ['1=1'];
    const params = [];
    addFilter(conditions, params, 'created_at >= ?', start_date);
    addFilter(conditions, params, 'created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    addFilter(conditions, params, 'vendor_id = ?', vendor_id);
    addFilter(conditions, params, 'property_id = ?', property_id);
    const whereClause = conditions.join(' AND ');

    const [bookingStatus] = await pool.query(
      `SELECT booking_status AS label, COUNT(*) AS value FROM bookings WHERE ${whereClause} GROUP BY booking_status`,
      params
    );
    const [paymentStatus] = await pool.query(
      `SELECT payment_status AS label, COUNT(*) AS value FROM bookings WHERE ${whereClause} GROUP BY payment_status`,
      params
    );
    const [propertyStatus] = await pool.query(
      `SELECT status AS label, COUNT(*) AS value FROM properties GROUP BY status`
    );
    const [vendorStatus] = await pool.query(
      `SELECT status AS label, COUNT(*) AS value FROM vendors GROUP BY status`
    );

    return ok(res, { booking_status: bookingStatus, payment_status: paymentStatus, property_status: propertyStatus, vendor_status: vendorStatus });
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 12) TOP PERFORMERS  ->  GET /admin/analytics/top-performers
//     Filters: type(vendors|properties, default vendors), metric(revenue|bookings, default revenue),
//              limit (default 10), start_date, end_date
// =============================================================================
export const getTopPerformers = async (req, res) => {
  try {
    const { type = 'vendors', metric = 'revenue', start_date, end_date } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const conditions = ['1=1'];
    const params = [];
    addFilter(conditions, params, 'b.created_at >= ?', start_date);
    addFilter(conditions, params, 'b.created_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    const whereClause = conditions.join(' AND ');

    const orderCol = metric === 'bookings' ? 'total_bookings' : 'revenue';

    let rows;
    if (type === 'properties') {
      [rows] = await pool.query(
        `SELECT p.id, p.property_name, CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
                COUNT(b.id) AS total_bookings,
                COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
                COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
         FROM properties p
         LEFT JOIN vendors v ON v.id = p.vendor_id
         LEFT JOIN bookings b ON b.property_id = p.id AND ${whereClause.replace(/b\./g, 'b.')}
         GROUP BY p.id
         ORDER BY ${orderCol} DESC
         LIMIT ?`,
        [...params, limit]
      );
    } else {
      [rows] = await pool.query(
        `SELECT v.id, v.business_name, CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
                COUNT(DISTINCT p.id) AS total_properties,
                COUNT(b.id) AS total_bookings,
                COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
                COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
         FROM vendors v
         LEFT JOIN properties p ON p.vendor_id = v.id
         LEFT JOIN bookings b ON b.vendor_id = v.id AND ${whereClause}
         GROUP BY v.id
         ORDER BY ${orderCol} DESC
         LIMIT ?`,
        [...params, limit]
      );
    }

    return ok(res, rows);
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 13) CITY-WISE STATS  ->  GET /admin/analytics/city-stats
//     Properties + bookings + revenue grouped by city (via property_addresses)
// =============================================================================
export const getCityWiseStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pa.city, pa.state,
              COUNT(DISTINCT p.id) AS total_properties,
              COUNT(DISTINCT b.id) AS total_bookings,
              COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.id END) AS cancelled_bookings,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue
       FROM property_addresses pa
       LEFT JOIN properties p ON p.id = pa.property_id
       LEFT JOIN bookings b ON b.property_id = p.id
       GROUP BY pa.city, pa.state
       ORDER BY revenue DESC`
    );
    return ok(res, rows);
  } catch (err) {
    return fail(res, err);
  }
};

// =============================================================================
// 14) CANCELLATION REPORT  ->  GET /admin/analytics/cancellations
//     Filters: vendor_id, property_id, cancelled_by, start_date, end_date, page, limit
// =============================================================================
export const getCancellationReport = async (req, res) => {
  try {
    const { vendor_id, property_id, cancelled_by, start_date, end_date } = req.query;
    const { page, limit, offset } = getPagination(req);

    const conditions = [`b.booking_status = 'cancelled'`];
    const params = [];
    addFilter(conditions, params, 'b.vendor_id = ?', vendor_id);
    addFilter(conditions, params, 'b.property_id = ?', property_id);
    addFilter(conditions, params, 'b.cancelled_by = ?', cancelled_by);
    addFilter(conditions, params, 'b.cancelled_at >= ?', start_date);
    addFilter(conditions, params, 'b.cancelled_at <= ?', end_date ? `${end_date} 23:59:59` : undefined);
    const whereClause = conditions.join(' AND ');

    const [rows] = await pool.query(
      `SELECT b.id, b.booking_number, b.total_amount, b.cancellation_reason, b.cancelled_at,
              b.cancelled_by, b.contact_name, p.property_name,
              CONCAT(v.first_name,' ',v.last_name) AS vendor_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       LEFT JOIN vendors v ON v.id = b.vendor_id
       WHERE ${whereClause}
       ORDER BY b.cancelled_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b WHERE ${whereClause}`,
      params
    );

    const [[{ total_lost_revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(b.total_amount), 0) AS total_lost_revenue FROM bookings b WHERE ${whereClause}`,
      params
    );

    // Breakdown of who cancelled (user / vendor / admin)
    const [byActor] = await pool.query(
      `SELECT COALESCE(cancelled_by, 'unknown') AS label, COUNT(*) AS value
       FROM bookings WHERE booking_status = 'cancelled'
       GROUP BY cancelled_by`
    );

    return ok(res, rows, {
      page, limit, total, total_pages: Math.ceil(total / limit),
      total_lost_revenue, by_actor: byActor,
    });
  } catch (err) {
    return fail(res, err);
  }
};

export default {
  getDashboardOverview,
  getVendorsReport,
  getVendorDetails,
  getPropertiesReport,
  getPropertyDetails,
  getBookingsReport,
  getBookingDetails,
  getUsersReport,
  getUserDetails,
  getBookingRevenueTrend,
  getStatusDistribution,
  getTopPerformers,
  getCityWiseStats,
  getCancellationReport,
};