/**
 * Example unit test
 * This file demonstrates basic Jest testing
 */

describe('Example Test Suite', () => {
  test('basic math works', () => {
    expect(1 + 1).toBe(2);
  });

  test('arrays work correctly', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('objects work correctly', () => {
    const obj = { name: 'Checkers', type: 'game' };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Checkers');
  });
});

describe('DOM Tests', () => {
  beforeEach(() => {
    // Setup DOM before each test
    document.body.innerHTML = '<div id="test"></div>';
  });

  test('can manipulate DOM', () => {
    const div = document.getElementById('test');
    expect(div).toBeTruthy();
    div.textContent = 'Hello';
    expect(div.textContent).toBe('Hello');
  });
});
