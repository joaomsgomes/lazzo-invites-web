/**
 * Public TestFlight join link for the landing CTAs.
 * Set NEXT_PUBLIC_TESTFLIGHT_URL to override (e.g. staging).
 */
export const LAZZO_TESTFLIGHT_URL =
  process.env.NEXT_PUBLIC_TESTFLIGHT_URL?.trim() ||
  'https://testflight.apple.com/join/b1D3qpJK';
