import Razorpay from "razorpay";

// Reads keys from environment. Until you add real keys to .env,
// this throws a clear error instead of silently failing at payment time.
export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === "rzp_test_xxxxxxxx") {
    throw new Error(
      "Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file (get test keys from the Razorpay dashboard)."
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
