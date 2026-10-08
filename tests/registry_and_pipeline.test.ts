import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { OperationRegistry } from '../src/core/registry.js';
import { executeRecipe, RecipeStep } from '../src/core/pipeline.js';

describe('Operation Registry', () => {
  const registry = OperationRegistry.getInstance();

  test('Registry contains all target operation categories', () => {
    const all = registry.getAll();
    assert.ok(all.length >= 18, `Expected at least 18 operations, got ${all.length}`);

    const categories = ['Bases', 'Radix', 'Ciphers', 'Hashing', 'Web & Tokens'] as const;
    for (const cat of categories) {
      const ops = registry.getByCategory(cat);
      assert.ok(ops.length > 0, `Category ${cat} should have registered operations`);
    }
  });

  test('Operation retrieval and fuzzy search', () => {
    const b64 = registry.get('to-base64');
    assert.ok(b64);
    assert.equal(b64?.name, 'To Base64');

    const searchResults = registry.search('jwt');
    assert.ok(searchResults.length > 0);
    assert.ok(searchResults.some(op => op.id === 'jwt-decode'));

    const searchAliases = registry.search('b64');
    assert.ok(searchAliases.some(op => op.id === 'to-base64'));
  });

  test('Single-op execution via registry', async () => {
    const toHexOp = registry.get('to-hex');
    assert.ok(toHexOp);
    const input = new TextEncoder().encode('ABC');
    const output = await toHexOp.run(input, { delimiter: 'Space' });
    const outputStr = new TextDecoder().decode(output);
    assert.equal(outputStr, '41 42 43');
  });
});

describe('Recipe Pipeline Execution', () => {
  test('Executes multi-step recipe sequentially: Text -> To Hex -> From Hex -> To Base64', async () => {
    const input = new TextEncoder().encode('CyberChef VSCode');

    const steps: RecipeStep[] = [
      { opId: 'to-hex', args: { delimiter: 'None' }, enabled: true },
      { opId: 'from-hex', args: {}, enabled: true },
      { opId: 'to-base64', args: { urlSafe: false }, enabled: true }
    ];

    const result = await executeRecipe(input, steps);
    assert.equal(result.success, true);
    assert.equal(result.stepResults.length, 3);
    const finalStr = new TextDecoder().decode(result.finalOutput);
    assert.equal(finalStr, Buffer.from('CyberChef VSCode').toString('base64'));
  });

  test('Executes multi-step recipe with cipher: Text -> XOR -> XOR (reversibility)', async () => {
    const input = new TextEncoder().encode('SuperSecret');

    const steps: RecipeStep[] = [
      { opId: 'xor', args: { key: 'secret-key', format: 'utf8' }, enabled: true },
      { opId: 'xor', args: { key: 'secret-key', format: 'utf8' }, enabled: true }
    ];

    const result = await executeRecipe(input, steps);
    assert.equal(result.success, true);
    assert.deepEqual(result.finalOutput, input);
  });

  test('Handles disabled steps gracefully', async () => {
    const input = new TextEncoder().encode('CyberChef');

    const steps: RecipeStep[] = [
      { opId: 'to-base64', args: { urlSafe: false }, enabled: false }
    ];

    const result = await executeRecipe(input, steps);
    assert.equal(result.success, true);
    assert.deepEqual(result.finalOutput, input);
  });

  test('Reports error cleanly if a step receives invalid input', async () => {
    const input = new TextEncoder().encode('Not Valid Hex!');

    const steps: RecipeStep[] = [
      { opId: 'from-hex', args: {}, enabled: true }
    ];

    const result = await executeRecipe(input, steps);
    assert.equal(result.success, false);
    assert.ok(result.error);
    assert.equal(result.failedStepIndex, 0);
  });
});
