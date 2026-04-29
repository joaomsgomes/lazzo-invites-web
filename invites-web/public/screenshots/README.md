# App Screenshots

Drop real app screenshots here. They are rendered inside `PhoneFrame`
(280×580 CSS px, `object-cover`) on the landing page phase sections.

## Files expected

- `planning.png` — Planning phase screen (voting / date picker / RSVP)
- `living.png`   — Living phase screen (photo feed / live chat / arrivals)
- `recap.png`    — Recap phase screen (photo mosaic / share link)

## Recommended source

Export from a real iPhone or simulator at native resolution (e.g. iPhone 15
Pro = 1179×2556). PNG preferred. Avoid device chrome — the landing page
already draws a phone frame around the image.

## Aspect ratio

The frame's visible area is ~280×580 ≈ 9:18.7 (very close to modern iPhone
9:19.5). `object-cover` crops safely on the short axis, so slight aspect
mismatches are fine.

## Paths

Referenced from `app/page.tsx` via `/screenshots/<file>.png`.
If a file is missing, the phone frame will show a broken-image slot — drop
the file in and hard-refresh to confirm.
