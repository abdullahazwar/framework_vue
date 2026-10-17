import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { addDays } from '../../src/domain/dates.ts';
import { STORAGE_KEY } from '../../src/features/workspace/repository.ts';
import type { Backup, Workspace } from '../../src/domain/models.ts';

async function workspace(page: Page): Promise<Workspace> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
}
async function visit(page: Page, route = '/') {
  await page.goto(`/#${route}`);
  await expect(page.locator('main h1')).toBeVisible();
}
function file(contents: string, name = 'cadangan.json') {
  return { name, mimeType: 'application/json', buffer: Buffer.from(contents) };
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-17T03:00:00.000Z'));
});

test('buat, edit, pindah status, arsip, hapus cascade, dan pulihkan proyek', async ({
  page,
}) => {
  await visit(page, '/projects');
  await page.getByRole('button', { name: 'Proyek baru', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Nama proyek', { exact: true })
    .fill('Peluncuran aplikasi');
  await dialog.getByLabel('Deskripsi').fill('Proyek pengujian end-to-end');
  await dialog
    .getByRole('combobox', { name: 'Kategori', exact: true })
    .selectOption('Pekerjaan');
  await dialog
    .getByRole('button', { name: 'Buat proyek', exact: true })
    .click();
  await expect(page.locator('main h1')).toHaveText('Peluncuran aplikasi');
  const route = page.url();
  await page.getByRole('button', { name: 'Edit proyek', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Nama proyek')
    .fill('Peluncuran Vue');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Simpan perubahan' })
    .click();
  await expect(page.locator('main h1')).toHaveText('Peluncuran Vue');
  await page.getByRole('button', { name: 'Tambah tugas', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Judul tugas').fill('Siapkan rilis pertama');
  await dialog
    .getByRole('combobox', { name: 'Prioritas', exact: true })
    .selectOption('high');
  await dialog.getByLabel('Tenggat').fill('2026-10-20');
  await dialog
    .getByRole('button', { name: 'Tambah tugas', exact: true })
    .click();
  await page
    .getByRole('combobox', {
      name: 'Status Siapkan rilis pertama',
      exact: true,
    })
    .selectOption('doing');
  await expect(page.locator('[data-status="doing"] .task-card')).toContainText(
    'Siapkan rilis pertama',
  );
  await page
    .getByRole('combobox', {
      name: 'Status Siapkan rilis pertama',
      exact: true,
    })
    .selectOption('done');
  await expect(page.locator('progress').first()).toHaveAttribute(
    'value',
    '100',
  );
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Peluncuran Vue');
  expect(
    (await workspace(page)).tasks.find(
      (item) => item.title === 'Siapkan rilis pertama',
    )?.completedAt,
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Arsipkan', exact: true }).click();
  await expect(
    page.getByRole('combobox', {
      name: 'Status Siapkan rilis pertama',
      exact: true,
    }),
  ).toBeDisabled();
  await visit(page, '/tasks?q=Siapkan%20rilis');
  await expect(page.locator('.result-count')).toHaveText('0 tugas ditemukan');
  await page.goto(route);
  await page.getByRole('button', { name: 'Buka kembali', exact: true }).click();
  await page.getByRole('button', { name: 'Catatan baru', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Judul catatan')
    .fill('Catatan peluncuran');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Simpan catatan' })
    .click();
  await page.getByRole('button', { name: 'Hapus proyek', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'Termasuk 1 tugas dan 1 catatan',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Hapus data', exact: true })
    .click();
  await expect(page.locator('.project-grid')).not.toContainText(
    'Peluncuran Vue',
  );
  expect((await workspace(page)).tasks).toHaveLength(12);
  await page.getByRole('button', { name: 'Pulihkan', exact: true }).click();
  expect((await workspace(page)).tasks).toHaveLength(13);
  await expect(
    page.getByRole('link', { name: 'Peluncuran Vue', exact: true }),
  ).toBeVisible();
});

test('filter tugas tergabung di URL, dapat dimuat ulang, dan tugas dapat dibuka kembali', async ({
  page,
}) => {
  await visit(page, '/tasks');
  await expect(page.locator('.result-count')).toHaveText('9 tugas ditemukan');
  await page.getByLabel('Cari tugas', { exact: true }).fill('portofolio');
  await expect(page.locator('.result-count')).toHaveText('3 tugas ditemukan');
  await page
    .getByRole('combobox', { name: 'Prioritas', exact: true })
    .selectOption('high');
  await expect(page.locator('.result-count')).toHaveText('1 tugas ditemukan');
  await page
    .getByRole('combobox', { name: 'Tenggat', exact: true })
    .selectOption('today');
  await expect(page).toHaveURL(/due=today/);
  await page.reload();
  await expect(page.getByLabel('Cari tugas', { exact: true })).toHaveValue(
    'portofolio',
  );
  await page
    .getByLabel('Selesaikan Tulis proses studi kasus', { exact: true })
    .click();
  await expect(page.locator('.result-count')).toHaveText('0 tugas ditemukan');
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await expect(page.locator('.result-count')).toHaveText('8 tugas ditemukan');
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('done');
  await page
    .getByLabel('Buka kembali Tulis proses studi kasus', { exact: true })
    .click();
  expect(
    (await workspace(page)).tasks.find((item) => item.id === 'task_case')
      ?.completedAt,
  ).toBeNull();
});

test('agenda memilih pekan dan menambahkan tugas dengan tanggal hari terpilih', async ({
  page,
}) => {
  await visit(page, '/agenda');
  await page
    .getByLabel('Pilih tanggal pekan', { exact: true })
    .fill('2026-10-26');
  await expect(
    page.getByLabel('Pilih tanggal pekan', { exact: true }),
  ).toHaveValue('2026-10-26');
  const day = page.locator('.agenda-day').nth(2);
  await day.getByRole('button', { name: /Tambah tugas untuk/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Tenggat')).toHaveValue(
    addDays('2026-10-26', 2),
  );
  await dialog.getByLabel('Judul tugas').fill('Tugas dari agenda');
  await dialog
    .getByRole('button', { name: 'Tambah tugas', exact: true })
    .click();
  await expect(day).toContainText('Tugas dari agenda');
  await page.getByRole('button', { name: 'Pekan ini', exact: true }).click();
  await expect(
    page.getByLabel('Pilih tanggal pekan', { exact: true }),
  ).toHaveValue('2026-10-12');
});

test('catatan CRUD menjaga teks biasa dan pemilihan setelah pencarian', async ({
  page,
}) => {
  await visit(page, '/notes?q=tidak-ada');
  await page.getByRole('button', { name: 'Catatan baru', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Judul catatan').fill('Ide <b>pribadi</b>');
  const body = '  Baris satu\n\n<script>window.__xss = true</script>\n  ';
  await dialog.getByLabel('Isi catatan').fill(body);
  await dialog.getByRole('button', { name: 'Simpan catatan' }).click();
  await expect(page.locator('.note-reader h2')).toHaveText(
    'Ide <b>pribadi</b>',
  );
  await expect(page.locator('.note-body')).toHaveText(body);
  expect(await page.evaluate(() => '__xss' in window)).toBe(false);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Judul catatan').fill('Ide lanjutan');
  await dialog.getByRole('button', { name: 'Simpan catatan' }).click();
  await page.reload();
  await expect(page.locator('.note-reader h2')).toHaveText('Ide lanjutan');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Hapus', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Hapus data', exact: true })
    .click();
  await expect(page.locator('.notes-layout')).not.toContainText('Ide lanjutan');
  await page.getByRole('button', { name: 'Pulihkan', exact: true }).click();
  await expect(page.locator('.notes-layout')).toContainText('Ide lanjutan');
});

test('unduh backup, batalkan reset, kosongkan, lalu impor dengan pratinjau', async ({
  page,
}) => {
  await visit(page, '/settings');
  await page.getByLabel('Nama ruang', { exact: true }).fill('Studio saya');
  await page.getByRole('radio', { name: 'Gelap', exact: true }).check();
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.app-shell')).toHaveAttribute(
    'data-appearance',
    'dark',
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Unduh backup JSON' }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const contents = Buffer.concat(chunks).toString();
  const backup: Backup = JSON.parse(contents);
  expect(backup.data.tasks).toHaveLength(12);
  await page
    .getByRole('button', { name: 'Kosongkan ruang kerja', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Batal', exact: true })
    .click();
  expect((await workspace(page)).projects).toHaveLength(3);
  await page
    .getByRole('button', { name: 'Kosongkan ruang kerja', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ya, kosongkan ruang' })
    .click();
  expect((await workspace(page)).projects).toHaveLength(0);
  await page.reload();
  expect((await workspace(page)).tasks).toHaveLength(0);
  await page
    .getByLabel('Pilih cadangan JSON', { exact: true })
    .setInputFiles(file(contents));
  await expect(
    page.getByRole('dialog', { name: 'Pulihkan cadangan?' }),
  ).toBeVisible();
  expect((await workspace(page)).tasks).toHaveLength(0);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ganti dengan cadangan' })
    .click();
  await expect(page.getByLabel('Nama ruang', { exact: true })).toHaveValue(
    'Studio saya',
  );
  expect((await workspace(page)).tasks).toHaveLength(12);
});

test('berkas cadangan salah ditolak dan data lama tetap utuh', async ({
  page,
}) => {
  await visit(page, '/settings');
  const before = await workspace(page);
  await page
    .getByLabel('Pilih cadangan JSON', { exact: true })
    .setInputFiles(file('{broken'));
  await expect(page.getByRole('alert')).toContainText('bukan JSON');
  expect(await workspace(page)).toEqual(before);
  const bad = {
    application: 'ruang-kerja',
    version: 1,
    exportedAt: before.savedAt,
    data: { ...before, schemaVersion: 9 },
  };
  await page
    .getByLabel('Pilih cadangan JSON', { exact: true })
    .setInputFiles(file(JSON.stringify(bad)));
  await expect(page.getByRole('alert')).toContainText('Versi cadangan');
  expect(await workspace(page)).toEqual(before);
});

test('dialog dapat ditutup dengan Escape dan fokus kembali ke pemicu', async ({
  page,
}) => {
  await visit(page, '/projects');
  const button = page.getByRole('button', { name: 'Proyek baru', exact: true });
  await button.click();
  await expect(
    page.getByRole('dialog').getByLabel('Nama proyek'),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByLabel('Buka menu navigasi').click();
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  await expect(page.getByLabel('Buka menu navigasi')).toBeFocused();
});

test('data rusak tidak ditimpa dan tersedia unduhan salinan mentah', async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{invalid-data'),
    STORAGE_KEY,
  );
  await visit(page, '/settings');
  await expect(page.locator('.storage-banner')).toContainText('belum ditimpa');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe('{invalid-data');
  await expect(
    page.getByRole('button', { name: 'Unduh data mentah' }),
  ).toBeVisible();
  await page.getByLabel('Nama ruang', { exact: true }).fill('Percobaan');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.getByRole('alert')).toContainText('belum dapat dibaca');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe('{invalid-data');
});

test('dua tab mendeteksi konflik, menjaga draf, dan memuat perubahan eksplisit', async ({
  page,
  context,
}) => {
  await visit(page, '/projects');
  const second = await context.newPage();
  await visit(second, '/settings');
  await page.getByRole('button', { name: 'Proyek baru', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Nama proyek')
    .fill('Draf tab pertama');
  await second.getByLabel('Nama ruang', { exact: true }).fill('Dari tab kedua');
  await second.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.storage-banner')).toContainText(
    'tab lain berubah',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Buat proyek', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'tab lain',
  );
  await expect(page.getByRole('dialog').getByLabel('Nama proyek')).toHaveValue(
    'Draf tab pertama',
  );
  expect((await workspace(second)).projects).toHaveLength(3);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Muat perubahan' }).click();
  await expect(page.locator('.desktop-context')).toContainText(
    'Dari tab kedua',
  );
  await second.close();
});

test('quota gagal menampilkan mode memori dan tombol coba simpan memulihkan persistensi', async ({
  page,
}) => {
  await visit(page, '/settings');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, 'restoreStorageForTest', {
      value: () => {
        Storage.prototype.setItem = original;
      },
      configurable: true,
    });
    Storage.prototype.setItem = () => {
      throw new DOMException('Test quota', 'QuotaExceededError');
    };
  });
  await page.getByLabel('Nama ruang', { exact: true }).fill('Ruang sementara');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.storage-banner')).toContainText(
    'hanya tersimpan di tab ini',
  );
  expect((await workspace(page)).preferences.workspaceName).toBe(
    'Ruang pribadi',
  );
  await expect(page.getByLabel('Nama ruang', { exact: true })).toHaveValue(
    'Ruang sementara',
  );
  await page.evaluate(() => Reflect.get(window, 'restoreStorageForTest')());
  await page.getByRole('button', { name: 'Coba simpan', exact: true }).click();
  await expect(page.locator('.storage-banner')).toHaveCount(0);
  expect((await workspace(page)).preferences.workspaceName).toBe(
    'Ruang sementara',
  );
});

test('ruang kosong menyediakan langkah awal dan proyek yang hilang memiliki arah kembali', async ({
  page,
}) => {
  await visit(page, '/settings');
  await page
    .getByRole('button', { name: 'Kosongkan ruang kerja', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ya, kosongkan ruang' })
    .click();
  await visit(page, '/tasks');
  await page
    .getByRole('button', { name: 'Tambah tugas', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'Buat proyek lebih dahulu',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Buat proyek', exact: true })
    .click();
  await page.getByRole('dialog').getByLabel('Nama proyek').fill('Awal baru');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Buat proyek', exact: true })
    .click();
  await expect(page.locator('main h1')).toHaveText('Awal baru');
  await expect(page.locator('progress')).toHaveAttribute('value', '0');
  await visit(page, '/notes');
  await expect(
    page.getByRole('heading', { name: 'Ada ide yang ingin disimpan?' }),
  ).toBeVisible();
  await visit(page, '/projects/tidak-ada');
  await expect(page.locator('main h1')).toHaveText('Proyek tidak ditemukan.');
  await page.getByRole('link', { name: 'Lihat proyek', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Awal baru', exact: true }),
  ).toBeVisible();
});

test('tampilan seluruh rute pada empat lebar, tema gelap, serta tautan tidak ditemukan', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const routes = [
    '/',
    '/projects',
    '/projects/project_portfolio',
    '/tasks',
    '/agenda',
    '/notes',
    '/settings',
    '/tidak-ada',
  ];
  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of routes) {
      await visit(page, route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${route} overflow`,
      ).toBe(true);
      expect(await page.locator('h1').count()).toBe(1);
      expect(
        await page
          .locator('[style]')
          .evaluateAll((elements) =>
            elements.some((element) =>
              Boolean(element.getAttribute('style')?.trim()),
            ),
          ),
      ).toBe(false);
      expect(
        await page
          .locator('button')
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.getBoundingClientRect().width > 0)
              .every((element) =>
                Boolean(
                  element.textContent?.trim() ||
                    element.getAttribute('aria-label'),
                ),
              ),
          ),
      ).toBe(true);
    }
  }
  await visit(page, '/settings');
  await page.getByRole('radio', { name: 'Gelap', exact: true }).check();
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await visit(page, '/');
  await expect(page.locator('.app-shell')).toHaveAttribute(
    'data-appearance',
    'dark',
  );
  expect(
    await page
      .locator('.app-shell')
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--bg').trim(),
      ),
  ).toBe('#19231e');
  expect(errors).toEqual([]);
});
