import { test, expect } from "@playwright/test";

test("con coordenadas muestra la pantalla 'Activar cámara'", async ({
  page,
}) => {
  await page.goto("/visor?lat=40.4168&lng=-3.7038");
  await expect(
    page.getByRole("heading", { name: /Activa la cámara/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Activar cámara/i }),
  ).toBeVisible();
});

test("sin coordenadas, al activar avisa que faltan", async ({ page }) => {
  await page.goto("/visor");
  await page.getByRole("button", { name: /Activar cámara/i }).click();
  await expect(
    page.getByRole("heading", { name: /Faltan las coordenadas/i }),
  ).toBeVisible();
});

test("modo demo muestra la intro de demo", async ({ page }) => {
  await page.goto("/visor?demo=1");
  await expect(page.getByText(/Modo demo/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Activar cámara/i }),
  ).toBeVisible();
});
