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

describe('Checkers App - Board Rendering Tests', () => {
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
    const htmlPath = path.join(__dirname, '../public/index.html');
    await page.goto(`file://${htmlPath}`);
    // Wait for board to initialize
    await page.waitForSelector('.square');
  });

  afterEach(async () => {
    await page.close();
  });

  test('board renders with 64 squares', async () => {
    const squares = await page.$$('.square');
    expect(squares).toHaveLength(64);
  });

  test('board renders with correct initial piece positions', async () => {
    // RED pieces should be on rows 5-7, BLACK pieces on rows 0-2
    const redPieces = await page.$$('.piece.red:not(.king)');
    const blackPieces = await page.$$('.piece.black:not(.king)');

    expect(redPieces).toHaveLength(12);
    expect(blackPieces).toHaveLength(12);
  });

  test('clicking piece shows valid move highlights', async () => {
    // Click on a RED piece at row 5, col 0
    await page.click('[data-row="5"][data-col="0"]');

    // Check if squares are highlighted
    const highlightedSquares = await page.$$('.square.highlighted');
    expect(highlightedSquares.length).toBeGreaterThan(0);
  });

  test('clicking same piece twice deselects it', async () => {
    // Click on a piece
    await page.click('[data-row="5"][data-col="0"]');

    // Verify it's selected
    let selectedSquares = await page.$$('.square.selected');
    expect(selectedSquares).toHaveLength(1);

    // Click again
    await page.click('[data-row="5"][data-col="0"]');

    // Verify it's deselected
    selectedSquares = await page.$$('.square.selected');
    expect(selectedSquares).toHaveLength(0);
  });

  test('clicking highlighted square executes move', async () => {
    // Click on RED piece at (5,0)
    await page.click('[data-row="5"][data-col="0"]');

    // Wait a moment for highlights to appear
    await page.waitForSelector('.square.highlighted');

    // Click on highlighted square at (4,1)
    await page.click('[data-row="4"][data-col="1"]');

    // Verify piece moved
    const pieceAtNewPosition = await page.$('[data-row="4"][data-col="1"] .piece.red');
    expect(pieceAtNewPosition).toBeTruthy();

    // Verify old position is empty
    const pieceAtOldPosition = await page.$('[data-row="5"][data-col="0"] .piece');
    expect(pieceAtOldPosition).toBeFalsy();
  });

  test('game status updates after move', async () => {
    // Initial player should be RED
    let currentPlayer = await page.$eval('#current-player', el => el.textContent);
    expect(currentPlayer).toBe('Red');

    // Make a move
    await page.click('[data-row="5"][data-col="0"]');
    await page.waitForSelector('.square.highlighted');
    await page.click('[data-row="4"][data-col="1"]');

    // Wait a moment for state to update
    await page.waitForTimeout(100);

    // Current player should now be BLACK
    currentPlayer = await page.$eval('#current-player', el => el.textContent);
    expect(currentPlayer).toBe('Black');
  });

  test('pieces update correctly after moves', async () => {
    // Count initial pieces
    const initialRedPieces = await page.$$('.piece.red:not(.king)');
    expect(initialRedPieces).toHaveLength(12);

    // Make a move with RED
    await page.click('[data-row="5"][data-col="0"]');
    await page.waitForSelector('.square.highlighted');
    await page.click('[data-row="4"][data-col="1"]');

    // Still should have 12 RED pieces
    const afterMoveRedPieces = await page.$$('.piece.red:not(.king)');
    expect(afterMoveRedPieces).toHaveLength(12);
  });

  test('new game button resets board', async () => {
    // Make a move
    await page.click('[data-row="5"][data-col="0"]');
    await page.waitForSelector('.square.highlighted');
    await page.click('[data-row="4"][data-col="1"]');

    // Click new game button
    await page.click('#new-game-btn');

    // Wait for board to reset
    await page.waitForTimeout(100);

    // Verify piece is back at original position
    const pieceAtOriginalPosition = await page.$('[data-row="5"][data-col="0"] .piece.red');
    expect(pieceAtOriginalPosition).toBeTruthy();

    // Verify new position is empty (or has different piece)
    const pieceCount = await page.$$eval('[data-row="4"][data-col="1"] .piece', pieces => pieces.length);
    expect(pieceCount).toBe(0);
  });

  test('switching to different game mode starts new game', async () => {
    // Make a move in default local-2p mode
    await page.click('[data-row="5"][data-col="0"]');
    await page.waitForSelector('.square.highlighted');
    await page.click('[data-row="4"][data-col="1"]');

    // Switch to vs-ai-easy mode
    await page.click('#vs-ai-easy');

    // Wait for board to reset
    await page.waitForTimeout(100);

    // Verify board reset to initial state
    const redPieces = await page.$$('.piece.red:not(.king)');
    expect(redPieces).toHaveLength(12);

    // Verify piece is back at row 5
    const pieceAtRow5 = await page.$('[data-row="5"][data-col="0"] .piece.red');
    expect(pieceAtRow5).toBeTruthy();
  });
});
