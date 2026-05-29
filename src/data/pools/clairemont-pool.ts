import type { Pool } from "../../types/index.js";

/**
 * Clairemont Pool — City of San Diego (South Clairemont Recreation Center).
 * The pool program PDF at sandiego.gov is a closure notice, not a weekly schedule.
 * Renovations Oct 26, 2024 – spring 2026; PDF lists nearby open pools instead of lap swim.
 */
export const clairemontPool: Pool = {
  id: "clairemont-pool",
  name: "Clairemont Pool",
  address: "3600 Clairemont Drive, San Diego, CA 92117",
  location: { lat: 32.824, lng: -117.203 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass when open; child/senior/disabled $2.25. Pool closed for renovations (PDF lists nearby pools). Call (858) 581-9923 for reopening updates.",
  },
  scheduleSource: {
    label: "City of San Diego — Clairemont pool program PDF (closure notice)",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/clairemontpoolprogram.pdf",
    effectiveDate: "2024-10-26",
  },
  availability: [
    // PDF has no LAP SWIM section — pool closed for renovations.
    // Nearest open pools per PDF: Standley, Swanson, Kearny Mesa, Allied Gardens, Tierrasanta.
  ],
};
