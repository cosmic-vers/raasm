import crypto from "crypto";
import QRCode from "qrcode";

// Crockford-style alphabet: no 0/O, 1/I/L, so codes are unambiguous when
// read aloud or typed in by door staff under time pressure.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const RAW_LENGTH = 6;     // 32^6 ≈ 1.07 billion combinations - plenty for a 500-person event
const CHECKSUM_LENGTH = 4;

function randomAlphabetString(length) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function checksumFor(raw) {
  const secret = process.env.TICKET_SECRET || "dev-secret-change-me";
  return crypto.createHmac("sha256", secret).update(raw).digest("hex").slice(0, CHECKSUM_LENGTH).toUpperCase();
}

// Short, staff-typeable code like "H4K9PX-7A2E". The checksum means a
// scanner can reject an obviously forged/mistyped code immediately,
// without a DB round-trip - the DB lookup still happens to catch
// duplicate use and confirm the ticket is real.
export function generateTicketCode() {
  const raw = randomAlphabetString(RAW_LENGTH);
  return `${raw}-${checksumFor(raw)}`;
}

export function verifyTicketCodeSignature(code) {
  const cleaned = (code || "").trim().toUpperCase();
  const [raw, checksum] = cleaned.split("-");
  if (!raw || !checksum || raw.length !== RAW_LENGTH || checksum.length !== CHECKSUM_LENGTH) return false;
  return checksumFor(raw) === checksum;
}

// Normalizes user-typed input (lowercase, stray spaces, no dash) to the
// canonical stored format before lookup.
export function normalizeTicketCode(code) {
  const cleaned = (code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== RAW_LENGTH + CHECKSUM_LENGTH) return cleaned;
  return `${cleaned.slice(0, RAW_LENGTH)}-${cleaned.slice(RAW_LENGTH)}`;
}

export async function ticketCodeToQrDataUrl(code) {
  return QRCode.toDataURL(code, { margin: 1, width: 320 });
}
