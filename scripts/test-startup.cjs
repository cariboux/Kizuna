const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../src/card-viewer.inc.js'), 'utf8');

test('card viewer initializes inside the strict game scope and preserves card inspection', () => {
  const inspected = [];
  const listeners = [];
  const context = vm.createContext({
    inspect: card => inspected.push(card),
    document: { addEventListener: (...args) => listeners.push(args) }
  });
  // Match the enclosing game's existing declarations. openCardViewer must be
  // supplied by the fragment itself; an undeclared assignment aborts startup
  // before KizunaGame is exposed and prevents Discord login initialization.
  const viewer = vm.runInContext(`(() => {
    'use strict';
    function openDetail(card) { inspect(card); }
    function closeBackdrop() {}
    function openCharacterProfile() {}
    function cpHideProfile() {}
    function kaMarketProfilePanel() {}
    function backMarkup() {}
    ${source}
    return openCardViewer;
  })()`, context);

  const card = { id: 'startup-test-card' };
  viewer(null);
  viewer(card);
  assert.deepEqual(inspected, [card]);
  assert.ok(listeners.some(([type]) => type === 'click'));
  assert.equal(Object.hasOwn(context, 'openCardViewer'), false, 'viewer stays inside the game scope');
});
