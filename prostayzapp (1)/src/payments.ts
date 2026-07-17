import { Platform, Alert } from "react-native";
import { api } from "./api";

export type PaymentOrderResponse = {
  order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string | null;
  mock: boolean;
};

export type PaymentSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
};

export type StartPaymentOptions = {
  amount: number; // in INR rupees
  bookingId?: string;
  bookingType?: "flight" | "stay" | "package";
  description?: string;
  name?: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
};

/**
 * Loads Razorpay checkout JS on web.
 */
function ensureRazorpayScript(): Promise<boolean> {
  if (Platform.OS !== "web") return Promise.resolve(false);
  // @ts-ignore
  if (typeof window === "undefined") return Promise.resolve(false);
  // @ts-ignore
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    // @ts-ignore
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    // @ts-ignore
    document.body.appendChild(script);
  });
}

/**
 * Universal payment launcher. On web with valid Razorpay keys: opens Razorpay checkout.
 * Falls back to mock-confirm flow (auto verifies) for development.
 */
export async function startPayment(opts: StartPaymentOptions): Promise<{ success: boolean; payment_id?: string; mock: boolean }> {
  // 1) Create order on backend
  const order = await api<PaymentOrderResponse>("/payments/create-order", {
    method: "POST",
    auth: true,
    body: {
      amount: opts.amount,
      booking_id: opts.bookingId,
      booking_type: opts.bookingType,
      notes: opts.notes || {},
    },
  });

  // 2) Mock mode → auto verify
  if (order.mock || !order.key_id) {
    const mockPaymentId = `pay_mock_${Date.now()}`;
    await api("/payments/verify", {
      method: "POST",
      auth: true,
      body: {
        razorpay_order_id: order.order_id,
        razorpay_payment_id: mockPaymentId,
        booking_id: opts.bookingId,
        booking_type: opts.bookingType,
      },
    });
    return { success: true, payment_id: mockPaymentId, mock: true };
  }

  // 3) Real Razorpay on web
  if (Platform.OS === "web") {
    const loaded = await ensureRazorpayScript();
    if (!loaded) {
      Alert.alert("Payment", "Failed to load Razorpay. Please retry.");
      return { success: false, mock: false };
    }
    return new Promise((resolve) => {
      const options: any = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: opts.name || "Prostayz",
        description: opts.description || "Booking payment",
        order_id: order.order_id,
        prefill: {
          name: opts.name || "",
          email: opts.email || "",
          contact: opts.contact || "",
        },
        notes: opts.notes || {},
        theme: { color: "#6B8E5A" },
        handler: async (response: any) => {
          try {
            await api("/payments/verify", {
              method: "POST",
              auth: true,
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: opts.bookingId,
                booking_type: opts.bookingType,
              },
            });
            resolve({ success: true, payment_id: response.razorpay_payment_id, mock: false });
          } catch (e: any) {
            Alert.alert("Verification failed", e.message || "Could not verify payment");
            resolve({ success: false, mock: false });
          }
        },
        modal: {
          ondismiss: () => resolve({ success: false, mock: false }),
        },
      };
      // @ts-ignore
      const rp = new (window as any).Razorpay(options);
      rp.open();
    });
  }

  // 4) Native fallback (Expo Go does not support native Razorpay SDK)
  // For development, auto-confirm; in production use react-native-razorpay with EAS build.
  const mockPaymentId = `pay_native_mock_${Date.now()}`;
  await api("/payments/verify", {
    method: "POST",
    auth: true,
    body: {
      razorpay_order_id: order.order_id,
      razorpay_payment_id: mockPaymentId,
      booking_id: opts.bookingId,
      booking_type: opts.bookingType,
    },
  });
  return { success: true, payment_id: mockPaymentId, mock: true };
}
