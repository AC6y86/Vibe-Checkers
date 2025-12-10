/**
 * Debug script to test moving a piece in the checkers game
 * Runs Puppeteer in visible mode so you can see what's happening
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function debugMove() {
  console.log('Launching browser in visible mode...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100 // Slow down operations so we can see what's happening
  });

  const page = await browser.newPage();

  // Set viewport size
  await page.setViewport({ width: 1024, height: 768 });

  // Set up console message listener BEFORE navigating
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  page.on('pageerror', err => {
    console.error('Page error:', err.message);
  });

  // Load from web server (serve from project root, access public/index.html)
  const url = 'http://localhost:8080/public/index.html';
  console.log('Loading:', url);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log('Page loaded!');
  } catch (err) {
    console.error('Navigation error:', err);
  }

  // Wait a moment to see what's happening
  await new Promise(r => setTimeout(r, 2000));

  // Check if the board element exists
  const board = await page.$('#board');
  console.log('Board element exists:', !!board);

  // Check if squares exist
  const squares = await page.$$('.square');
  console.log('Number of squares found:', squares.length);

  // Check if pieces exist
  const pieces = await page.$$('.piece');
  console.log('Number of pieces found:', pieces.length);

  // If squares exist, try to make a move
  if (squares.length > 0) {
    console.log('\n--- Attempting to move a piece ---');

    // Click on RED piece at row 5, col 0
    console.log('Clicking on RED piece at (5, 0)...');
    const pieceSquare = await page.$('[data-row="5"][data-col="0"]');

    if (pieceSquare) {
      await pieceSquare.click();
      await new Promise(r => setTimeout(r, 500));

      const highlighted = await page.$$('.square.highlighted');
      console.log('Highlighted squares (valid moves):', highlighted.length);

      if (highlighted.length > 0) {
        console.log('Clicking on (4, 1) to make move...');
        const targetSquare = await page.$('[data-row="4"][data-col="1"]');
        if (targetSquare) {
          await targetSquare.click();
          await new Promise(r => setTimeout(r, 500));

          const pieceAtNewPos = await page.$('[data-row="4"][data-col="1"] .piece.red');
          console.log('Move successful:', !!pieceAtNewPos);
        }
      }
    }
  }

  console.log('\n--- Browser will stay open for inspection ---');
  console.log('Check the browser console (F12) for any JavaScript errors');
  console.log('Press Ctrl+C to close\n');

  // Keep browser open for inspection
  await new Promise(r => setTimeout(r, 120000)); // Wait 2 minutes

  await browser.close();
}

debugMove().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
