/**
 * User-facing copy for invite identity verification (web).
 * Keep tone short, calm, and actionable.
 */
export const inviteAuthCopy = {
  emailRequired: "Enter the email you used when you RSVP'd.",
  emailInvalid: "That doesn't look like a valid email — check for typos.",
  notParticipant:
    "We couldn't match that email to this event's guest list. Use the same email you RSVP'd with.",
  verifyUnavailable:
    "We couldn't verify your email just now. Check your connection and try again.",
  sendCodeFailed: "We couldn't send the code. Please try again in a moment.",
  otpIncomplete: 'Enter all 6 digits from the email we sent you.',
  otpWrong: "That code didn't work. Try again or request a new code.",
  generic: 'Something went wrong. Please try again.',
} as const;
