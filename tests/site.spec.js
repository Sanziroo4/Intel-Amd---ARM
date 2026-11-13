import { test, expect } from '@playwright/test';

test('all local resources load and navigation targets exist', async ({ page }) => {
  const errors = [], failures = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.url().startsWith('http://127.0.0.1') && r.status() >= 400) failures.push(r.url()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/CHIP ATLAS/);
  for (const link of await page.locator('#main-nav a').all()) {
    const href = await link.getAttribute('href');
    await expect(page.locator(href)).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(href + '$'));
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'kk');
  expect(await page.locator('img').evaluateAll((images) => images.every((i) => i.complete && i.naturalWidth > 0))).toBeTruthy();
  expect(errors).toEqual([]); expect(failures).toEqual([]);
});

test('all disclosure cards open and close', async ({ page }) => {
  await page.goto('/');
  const disclosures = page.locator('details');
  expect(await disclosures.count()).toBe(21);
  for (const item of await disclosures.all()) {
    await item.locator('summary').click(); await expect(item).toHaveAttribute('open', '');
    await item.locator('summary').click(); await expect(item).not.toHaveAttribute('open', '');
  }
});

test('comparison, cache and scenario tabs respond, including keyboard', async ({ page }) => {
  await page.goto('/');
  for (const column of ['1', '2', '3']) {
    await page.locator(`[data-column="${column}"]`).click();
    await expect(page.locator('.comparison-table')).toHaveAttribute('data-highlight', column);
  }
  await page.locator('#cache-miss').click();
  await expect(page.locator('#cache-status')).toContainText('RAM → CPU');
  await expect(page.locator('#cache-miss')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#cache-hit').click();
  await expect(page.locator('#cache-status')).toContainText('CPU ↔ кэш');
  const titles = ['Бір браузер', 'Ойын', 'Кадрдан', 'Розеткасыз', 'Бір сервер'];
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-scenario="${i}"]`).click();
    await expect(page.locator('#scenario-title')).toContainText(titles[i]);
  }
  await page.locator('#tab-server').press('Home');
  await expect(page.locator('#tab-browser')).toBeFocused();
  await page.locator('#tab-browser').press('ArrowRight');
  await expect(page.locator('#tab-game')).toHaveAttribute('aria-selected', 'true');
});

test('CPU cycle can step, reset, start and pause without duplicate timers', async ({ page }) => {
  await page.goto('/');
  for (let i = 1; i <= 3; i++) { await page.locator('#cycle-next').click(); await expect(page.locator('#cycle-status')).toContainText(`${i} / 3`); }
  await expect(page.locator('#cycle-result')).toHaveText('8');
  await expect(page.locator('#cycle-next')).toBeDisabled();
  await page.locator('#cycle-reset').click();
  await expect(page.locator('#cycle-result')).toHaveText('?');
  await page.locator('#cycle-start').click();
  await expect(page.locator('#cycle-status')).toContainText('1 / 3');
  await page.locator('#cycle-pause').click();
  await expect(page.locator('#cycle-status')).toContainText('Кідіртілді');
  await page.waitForTimeout(2300);
  await expect(page.locator('#cycle-status')).toContainText('1 / 3');
  await page.locator('#cycle-start').click();
  await expect(page.locator('#cycle-status')).toContainText('2 / 3');
  await expect(page.locator('#cycle-result')).toHaveText('8', { timeout: 4000 });
});

test('quiz explanations, final score and restart', async ({ page }) => {
  await page.goto('/');
  const answers = [0,1,2,0,1,2,0,1];
  for (let i = 0; i < 8; i++) {
    await page.locator('#quiz-answers button').nth(answers[i]).click();
    await expect(page.locator('#quiz-feedback')).toContainText('Дұрыс!');
    await expect(page.locator('#quiz-answers button.correct')).toHaveCount(1);
    await page.locator('#quiz-next').click();
  }
  await expect(page.locator('#quiz-final-score')).toHaveText('8 / 8');
  await page.locator('#quiz-restart').click();
  await expect(page.locator('#quiz-score')).toHaveText('0 дұрыс жауап');
  await page.locator('#quiz-answers button').nth(1).click();
  await expect(page.locator('#quiz-feedback')).toContainText('Бұл жолы қате');
  await expect(page.locator('#quiz-answers button.incorrect')).toHaveCount(1);
});

test('glossary searches Kazakh terms and handles no results', async ({ page }) => {
  await page.goto('/');
  await page.locator('#glossary-search').fill('жедел');
  await expect(page.locator('.glossary-grid details:visible')).toHaveCount(1);
  await expect(page.locator('.glossary-grid details:visible summary')).toContainText('RAM');
  await page.locator('#glossary-search').fill('xyzxyz');
  await expect(page.locator('#glossary-empty')).toBeVisible();
  await page.locator('#glossary-search').fill('');
  await expect(page.locator('.glossary-grid details:visible')).toHaveCount(10);
});

test('reduced motion and explicit choice persist', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass('motion-off');
  expect(await page.locator('.hero-art .hero-drawing').evaluate((image) => getComputedStyle(image).animationName)).toBe('none');
  await page.locator('#motion-toggle').click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#motion-toggle').click();
  await page.reload();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
});

test('mobile navigation, disclosures, interactions and layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.menu-toggle').click();
  await expect(page.locator('#main-nav')).toBeVisible();
  await page.locator('#main-nav a[href="#architectures"]').click();
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.architecture-card').last().locator('summary').click();
  await expect(page.locator('.architecture-card').last().locator('details')).toHaveAttribute('open', '');
  await page.locator('#cycle-next').click();
  await expect(page.locator('#cycle-status')).toContainText('1 / 3');
  await page.locator('#quiz-answers button').first().click();
  await expect(page.locator('#quiz-feedback')).toContainText('Дұрыс!');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.goto('/');
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('tablet and desktop layouts have no horizontal overflow', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `viewport ${width}`).toBeTruthy();
  }
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});

test('video state is explicit; real media must play if supplied', async ({ page }) => {
  await page.goto('/');
  const manifest = await (await page.request.get('/assets/media.json')).json();
  if (!manifest.src) {
    await expect(page.locator('#video-pending')).toBeVisible();
    await expect(page.locator('#atlas-video')).toBeHidden();
    test.info().annotations.push({ type: 'blocked', description: 'Actual uploaded video exceeds transfer limit; playback remains unverified.' });
  } else {
    await expect(page.locator('#atlas-video')).toBeVisible();
    await page.locator('#atlas-video').evaluate(async (v) => { v.muted = true; await v.play(); });
    await expect.poll(() => page.locator('#atlas-video').evaluate((v) => v.currentTime)).toBeGreaterThan(.5);
    const duration = await page.locator('#atlas-video').evaluate((v) => v.duration);
    expect(duration).toBeGreaterThan(0);
    await page.locator('#atlas-video').evaluate((v) => { v.pause(); v.currentTime = v.duration / 2; });
    await expect.poll(() => page.locator('#atlas-video').evaluate((v) => v.seeking)).toBe(false);
  }
});
