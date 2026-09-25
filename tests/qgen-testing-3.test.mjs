import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURE_KEY, FEATURE_TITLE, describe, isEnabled } from '../qgen_features/testing-3.mjs';

test('feature is enabled by default', () => {
  assert.equal(isEnabled(), true);
});

test('feature can be disabled by flag', () => {
  assert.equal(isEnabled({ [FEATURE_KEY]: false }), false);
});

test('describe reports feature metadata', () => {
  assert.deepEqual(describe(), { key: FEATURE_KEY, title: FEATURE_TITLE, enabled: true });
});
