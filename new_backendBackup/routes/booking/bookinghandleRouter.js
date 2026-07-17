// routes/bookingRoutes.js
import express from "express"
import { authenticateAdmin, authenticateUser, authenticateVendor } from "../../middleware/auth.middleWare.js";
import { cancelBooking, confirmPayment, createBooking, getAllBookingsAdmin, getBookingById, getUserBookings, getVendorBookings, initiatePayment, updateBookingStatus } from "../../controller/booking/bookinghandling.js";
const bookingRouter = express.Router();
// const bookingController = require('../controllers/bookingController');

// Swap these for your real auth middleware (JWT decode for users, session check for vendor/admin)
// const { requireUser, requireVendor, requireAdmin } = require('../middleware/auth');

// -- User-facing --
bookingRouter.post('/bookings', authenticateUser, createBooking);
bookingRouter.get('/bookings/me', authenticateUser, getUserBookings);
bookingRouter.post('/bookings/:id/cancel', authenticateUser, cancelBooking);
bookingRouter.post('/bookings/:id/payments/initiate', authenticateUser, initiatePayment);
bookingRouter.post('/bookings/payments/:paymentId/confirm', authenticateUser, confirmPayment);

// -- Shared (user/vendor/admin, scoped inside controller) --
bookingRouter.get('/bookings/:id', authenticateUser, getBookingById);

// -- Vendor-facing --
bookingRouter.get('/vendor/bookings', authenticateVendor, getVendorBookings);
bookingRouter.patch('/vendor/bookings/:id/status', authenticateVendor, updateBookingStatus);
bookingRouter.post('/vendor/bookings/:id/cancel', authenticateVendor, cancelBooking);

// -- Admin-facing --
bookingRouter.get('/admin/bookings', authenticateAdmin, getAllBookingsAdmin);
bookingRouter.patch('/admin/bookings/:id/status', authenticateAdmin, updateBookingStatus);
bookingRouter.post('/admin/bookings/:id/cancel', authenticateAdmin, cancelBooking);

export default bookingRouter;
