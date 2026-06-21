import { test, expect } from "@playwright/test";

test("agregar requiere coordenadas y contenido", async ({ page }) => {
  await page.goto("/crear");
  const add = page.getByRole("button", { name: /Agregar a la lista/i });
  await expect(add).toBeDisabled();

  await page
    .getByLabel(/Coordenadas o link de Google Maps/i)
    .fill("-34.6037, -58.3816");
  // Falta el contenido (texto), sigue deshabilitado.
  await expect(add).toBeDisabled();

  await page.getByLabel(/Texto del cartel/i).fill("Hola");
  await expect(add).toBeEnabled();
});

test("genera un link con avisos codificados y un QR", async ({ page }) => {
  await page.goto("/crear");
  await page
    .getByLabel(/Coordenadas o link de Google Maps/i)
    .fill("19.4326, -99.1332");
  await page.getByLabel(/Texto del cartel/i).fill("Mi aviso");
  await page.getByRole("button", { name: /Agregar a la lista/i }).click();

  await expect(page.getByText(/^1 aviso$/i)).toBeVisible();

  const generate = page.getByRole("button", { name: /Generar link/i });
  await expect(generate).toBeEnabled();
  await generate.click();

  await expect(page.getByText(/\/visor\?pois=/)).toBeVisible();
  await expect(page.getByRole("img", { name: /Código QR/i })).toBeVisible();
});

test("texto basura no habilita agregar", async ({ page }) => {
  await page.goto("/crear");
  await page.getByLabel(/Coordenadas o link de Google Maps/i).fill("hola");
  await page.getByLabel(/Texto del cartel/i).fill("algo");
  await expect(
    page.getByRole("button", { name: /Agregar a la lista/i }),
  ).toBeDisabled();
});
