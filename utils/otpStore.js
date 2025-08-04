// Simple in-memory store; reset on server restart (for demo purposes)
const otpStore = new Map();

// Save OTP for a given email with expiry (5 mins)
function saveOTP(email, otp) {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, { otp, expiresAt });
}

// Verify OTP
function verifyOTP(email, otp) {
  if (!otpStore.has(email)) return false;
  const record = otpStore.get(email);

  if (record.expiresAt < Date.now()) {
    otpStore.delete(email);
    return false; // expired
  }
  if (record.otp !== otp) return false;

  otpStore.delete(email); // OTP verified, remove it
  return true;
}

module.exports = { saveOTP, verifyOTP };
