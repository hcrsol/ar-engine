import { test, expect } from "@playwright/test";

test("la página del spike carga y detecta soporte WebXR", async ({ page }) => {
  await page.goto("/spike");
  await expect(page.getByText(/Spike · WebXR/i)).toBeVisible();
  // En un navegador sin WebXR (headless), debe avisar que no hay soporte.
  await expect(
    page.getByRole("heading", { name: /no soporta WebXR/i }),
  ).toBeVisible();
});
