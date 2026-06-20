import { describe, expect, it } from "vitest";
import { parseExtraText } from "@/components/UsageFooter";

describe("UsageFooter helpers", () => {
  it("keeps quota reset times that contain punctuation", () => {
    expect(
      parseExtraText(
        "5小时: 32% 🕒 12:30 7天: 84% 🕒 2026-06-20T12:30:00Z",
      ),
    ).toEqual([
      { label: "5小时", percent: "32%", resetTime: "12:30" },
      {
        label: "7天",
        percent: "84%",
        resetTime: "2026-06-20T12:30:00Z",
      },
    ]);
  });
});
