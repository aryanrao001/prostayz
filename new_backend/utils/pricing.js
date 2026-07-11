// utils/pricing.js
// Pure helper functions — no DB calls here, so they're easy to unit test.

/**
 * Returns an array of date strings (YYYY-MM-DD) for each night of the stay.
 * check_out_date is exclusive (last night is the day before checkout).
 */
function getNightsList(checkInDate, checkOutDate) {
  const nights = [];
  const cur = new Date(checkInDate);
  const end = new Date(checkOutDate);
  while (cur < end) {
    nights.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

function isWeekend(dateStr) {
  const day = new Date(dateStr).getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

/**
 * Computes subtotal, extra guest amount, and tax for a room stay.
 *
 * @param {object} roomPrice - row from room_prices (price, weekend_price, extra_guest_price, tax)
 * @param {object} room - row from rooms (max_adults)
 * @param {string[]} nightsList - array of date strings
 * @param {number} adults
 * @param {Map<string, object>} availabilityOverrides - available_date -> room_availability row (optional per-date special_price)
 */
function calculateRoomStayPrice({ roomPrice, room, nightsList, adults, availabilityOverrides = new Map() }) {
  let subtotal = 0;

  for (const date of nightsList) {
    const override = availabilityOverrides.get(date);
    if (override && override.special_price != null) {
      subtotal += Number(override.special_price);
      continue;
    }
    subtotal += isWeekend(date)
      ? Number(roomPrice.weekend_price ?? roomPrice.price)
      : Number(roomPrice.price);
  }

  const extraAdults = Math.max(0, adults - (room.max_adults ?? adults));
  const extraGuestAmount = extraAdults * Number(roomPrice.extra_guest_price || 0) * nightsList.length;

  const taxableAmount = subtotal + extraGuestAmount;
  const taxRatePercent = Number(roomPrice.tax || 0);
  const taxAmount = +(taxableAmount * (taxRatePercent / 100)).toFixed(2);

  return {
    subtotal: +subtotal.toFixed(2),
    extraGuestAmount: +extraGuestAmount.toFixed(2),
    taxAmount,
  };
}

/**
 * Sums per-room breakdowns into booking-level totals, applying an optional flat/percent discount.
 */
function aggregateBookingTotals(roomBreakdowns, discountAmount = 0) {
  const totals = roomBreakdowns.reduce(
    (acc, r) => {
      acc.subtotal += r.subtotal * r.quantity;
      acc.extraGuestAmount += r.extraGuestAmount * r.quantity;
      acc.taxAmount += r.taxAmount * r.quantity;
      return acc;
    },
    { subtotal: 0, extraGuestAmount: 0, taxAmount: 0 }
  );

  const totalAmount = +(
    totals.subtotal + totals.extraGuestAmount + totals.taxAmount - discountAmount
  ).toFixed(2);

  return {
    subtotal: +totals.subtotal.toFixed(2),
    extraGuestAmount: +totals.extraGuestAmount.toFixed(2),
    taxAmount: +totals.taxAmount.toFixed(2),
    discountAmount: +Number(discountAmount).toFixed(2),
    totalAmount: totalAmount < 0 ? 0 : totalAmount,
  };
}

function generateBookingNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK${ts}${rand}`;
}

export {
  getNightsList,
  isWeekend,
  calculateRoomStayPrice,
  aggregateBookingTotals,
  generateBookingNumber,
};
