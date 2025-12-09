/**
 * Example Puppeteer integration test
 * This file demonstrates browser-based testing with Puppeteer
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Checkers App - Puppeteer Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../public/index.html');
    await page.goto(`file://${htmlPath}`);
  });

  afterEach(async () => {
    await page.close();
  });

  test('page loads successfully', async () => {
    const title = await page.title();
    expect(title).toBe('Checkers Game');
  });

  test('board element exists', async () => {
    const board = await page.$('#board');
    expect(board).toBeTruthy();
  });

  test('game controls exist', async () => {
    const controls = await page.$('#game-controls');
    expect(controls).toBeTruthy();
  });

  test('all mode buttons exist', async () => {
    const buttons = await page.$$('#mode-selector button');
    expect(buttons).toHaveLength(5);
  });

  test('hint button exists', async () => {
    const hintBtn = await page.$('#hint-btn');
    expect(hintBtn).toBeTruthy();

    const text = await page.$eval('#hint-btn', el => el.textContent);
    expect(text).toBe('Hint');
  });
});
