import assert from "node:assert/strict";
import {
  DEFAULT_CENTER_DAILY_DONATION_LIMIT,
  getCenterDailyDonationLimit,
  isCenterDailyLimitReached,
  toPublicDonation,
} from "../lib/donation-policy.ts";

assert.equal(DEFAULT_CENTER_DAILY_DONATION_LIMIT, 1000);
assert.equal(getCenterDailyDonationLimit(undefined), 1000);
assert.equal(getCenterDailyDonationLimit("2500"), 2500);
assert.equal(getCenterDailyDonationLimit("99"), 1000);
assert.equal(getCenterDailyDonationLimit("not-a-number"), 1000);

assert.equal(isCenterDailyLimitReached(999, 1000), false);
assert.equal(isCenterDailyLimitReached(1000, 1000), true);
assert.equal(isCenterDailyLimitReached(1001, 1000), true);

const publicDonation = toPublicDonation({
  id: "donation-1",
  memorial_id: "memorial-1",
  center_id: "center-1",
  donor_name: "Donor",
  donor_title: "Family",
  amount: 500,
  message: "Merit",
  slip_url: "slips/private/path.jpg",
  status: "confirmed",
  nameplate_status: "pending",
  created_at: "2026-06-15T00:00:00.000Z",
});

assert.deepEqual(Object.keys(publicDonation).includes("slip_url"), false);
assert.equal(publicDonation.amount, 500);
assert.equal(publicDonation.status, "confirmed");

console.log("donation-policy tests passed");
