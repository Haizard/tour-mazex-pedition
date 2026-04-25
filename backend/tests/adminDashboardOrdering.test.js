import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminDashboardPath = path.resolve(
  __dirname,
  "../../src/pages/AdminDashboard.jsx"
);

test("AdminDashboard declares booking review state before booking review effects", () => {
  const source = fs.readFileSync(adminDashboardPath, "utf8");

  const selectedBookingStateIndex = source.indexOf(
    "const [selectedBooking, setSelectedBooking] = useState(null);"
  );
  const reviewRequestsStateIndex = source.indexOf(
    "const [reviewRequests, setReviewRequests] = useState([]);"
  );
  const repeatCampaignStateIndex = source.indexOf(
    "const [repeatCustomerCampaigns, setRepeatCustomerCampaigns] = useState([]);"
  );
  const reviewEffectIndex = source.indexOf(
    "setSelectedBookingReviewRequest(getReviewRequestForBooking(selectedBooking._id));"
  );
  const repeatEffectIndex = source.indexOf(
    "setSelectedBookingRepeatCampaign(getRepeatCampaignForBooking(selectedBooking._id));"
  );

  assert.notEqual(selectedBookingStateIndex, -1);
  assert.notEqual(reviewRequestsStateIndex, -1);
  assert.notEqual(repeatCampaignStateIndex, -1);
  assert.notEqual(reviewEffectIndex, -1);
  assert.notEqual(repeatEffectIndex, -1);

  assert.equal(selectedBookingStateIndex < reviewEffectIndex, true);
  assert.equal(reviewRequestsStateIndex < reviewEffectIndex, true);
  assert.equal(repeatCampaignStateIndex < repeatEffectIndex, true);
});
