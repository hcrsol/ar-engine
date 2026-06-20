import { test, expect } from "@playwright/test";

test("la landing carga y muestra el título", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Ancla una campaña/i }),
  ).toBeVisible();
});

test("el CTA lleva al panel de creación", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Crear un aviso/i }).click();
  await expect(page).toHaveURL(/\/crear$/);
  await expect(
    page.getByRole("heading", { name: /Crear un aviso/i }),
  ).toBeVisible();
});
