import { test, expect } from "@playwright/test";

test("el botón está deshabilitado hasta tener coordenadas válidas", async ({
  page,
}) => {
  await page.goto("/crear");
  const generate = page.getByRole("button", { name: /Generar aviso/i });
  await expect(generate).toBeDisabled();

  await page
    .getByLabel(/Coordenadas o link de Google Maps/i)
    .fill("-34.6037, -58.3816");

  await expect(page.getByTestId("lat")).toHaveText("-34.603700");
  await expect(page.getByTestId("lng")).toHaveText("-58.381600");
  await expect(generate).toBeEnabled();
});

test("genera un link de visor con las coordenadas y un QR", async ({ page }) => {
  await page.goto("/crear");
  await page
    .getByLabel(/Coordenadas o link de Google Maps/i)
    .fill("19.4326, -99.1332");
  await page.getByRole("button", { name: /Generar aviso/i }).click();

  const link = page.getByText(/\/visor\?lat=19\.4326&lng=-99\.1332/);
  await expect(link).toBeVisible();
  await expect(page.getByRole("img", { name: /Código QR/i })).toBeVisible();
});

test("texto basura no habilita el botón", async ({ page }) => {
  await page.goto("/crear");
  await page.getByLabel(/Coordenadas o link de Google Maps/i).fill("hola");
  await expect(page.getByTestId("lat")).toHaveText("—");
  await expect(
    page.getByRole("button", { name: /Generar aviso/i }),
  ).toBeDisabled();
});
