const { computeScore } = require('../utils');

test('computeScore returns higher value for similar age', () => {
  const a = { age: 25, gender: 'M', lookingFor: 'F', interests: ['music'], blocked: new Set(), matched: new Set(), disliked: new Set() };
  const b = { age: 26, gender: 'F', interests: ['music'] };
  expect(computeScore(a, b)).toBeGreaterThan(0);
});
