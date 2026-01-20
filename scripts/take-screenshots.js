const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Landing page - hero section
  console.log('Taking landing page screenshots...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-landing-hero.png'), fullPage: false });

  // Scroll to How It Works
  await page.evaluate(() => document.getElementById('how-it-works')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-how-it-works.png'), fullPage: false });

  // Scroll to Pricing
  await page.evaluate(() => document.getElementById('pricing')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-pricing.png'), fullPage: false });

  // Scroll to Signup Form
  await page.evaluate(() => document.getElementById('signup')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-signup-form.png'), fullPage: false });

  // Full landing page
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00-landing-full.png'), fullPage: true });

  // Dashboard page (using demo mode)
  console.log('Taking dashboard screenshot...');
  await page.goto(`${BASE_URL}/dashboard?demo=true`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-dashboard.png'), fullPage: false });

  // Success page
  console.log('Taking success page screenshot...');
  await page.goto(`${BASE_URL}/success?name=Sarah`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-success.png'), fullPage: false });

  // Mobile viewport - landing
  console.log('Taking mobile screenshots...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-mobile-landing.png'), fullPage: false });

  // Mobile - dashboard (using demo mode)
  await page.goto(`${BASE_URL}/dashboard?demo=true`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-mobile-dashboard.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots complete!');
}

takeScreenshots().catch(console.error);
