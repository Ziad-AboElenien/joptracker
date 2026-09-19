import { test, expect } from "@playwright/test";

test("board renders default columns and can search", async ({ page }) => {
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Kanban Job Tracker" })).toBeVisible();
  await expect(page.getByTestId("column-col-0")).toBeVisible();
  await page.getByLabel("Search cards").fill("Acme");
  await expect(page.getByText("Acme Corp").first()).toBeVisible();
});
