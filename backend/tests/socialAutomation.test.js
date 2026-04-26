import test from "node:test";
import assert from "node:assert/strict";

import { buildSocialAutomationDashboard } from "../utils/socialAutomation.js";

test("buildSocialAutomationDashboard counts due scheduled posts", () => {
  const result = buildSocialAutomationDashboard(
    [
      {
        _id: "post-1",
        title: "Serengeti Launch",
        status: "scheduled",
        platforms: ["instagram"],
        scheduledFor: "2020-01-01T10:00:00.000Z",
      },
      {
        _id: "post-2",
        title: "Ngorongoro Story",
        status: "draft",
        platforms: ["facebook"],
      },
    ],
    [
      {
        _id: "account-1",
        status: "active",
      },
    ]
  );

  assert.equal(result.stats.totalPosts, 2);
  assert.equal(result.stats.dueNow, 1);
  assert.equal(result.stats.activeAccounts, 1);
  assert.equal(result.duePosts.length, 1);
});
