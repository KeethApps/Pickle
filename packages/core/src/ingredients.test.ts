import { describe, it, expect } from 'vitest';
import { parseIngredientLine, parseIngredientBlock, formatQty, formatAmount, parseQuantity } from './ingredients';

describe('parseQuantity', () => {
  it('handles fractions and mixed numbers', () => {
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
    expect(parseQuantity('½')).toBe(0.5);
    expect(parseQuantity('1½')).toBe(1.5);
    expect(parseQuantity('abc')).toBeNull();
  });
});

describe('parseIngredientLine', () => {
  it('parses quantity, unit and name', () => {
    expect(parseIngredientLine('2 tbsps olive oil')).toEqual({ qty: 2, unit: 'tbsp', name: 'olive oil' });
    expect(parseIngredientLine('1 lb salmon')).toEqual({ qty: 1, unit: 'lb', name: 'salmon' });
  });
  it('splits notes after a comma', () => {
    expect(parseIngredientLine('3 cloves garlic, minced')).toEqual({ qty: 3, unit: 'clove', name: 'garlic', note: 'minced' });
  });
  it('keeps lines with no quantity unscaled', () => {
    expect(parseIngredientLine('salt to taste')).toEqual({ qty: null, unit: null, name: 'salt to taste' });
  });
  it('handles unit-less counts and unicode fractions', () => {
    expect(parseIngredientLine('½ yellow onion, diced')).toEqual({ qty: 0.5, unit: null, name: 'yellow onion', note: 'diced' });
    expect(parseIngredientLine('¾ cups heavy cream')).toEqual({ qty: 0.75, unit: 'cup', name: 'heavy cream' });
  });
  it('uses the upper bound of a range', () => {
    expect(parseIngredientLine('2 to 3 lemons').qty).toBe(3);
  });
});

describe('parseIngredientBlock', () => {
  it('reads groups', () => {
    const lines = parseIngredientBlock('Salmon:\n1 lb salmon\n1 tsp salt\nSauce:\n4 tbsps butter');
    expect(lines.map((l) => l.group)).toEqual(['Salmon', 'Salmon', 'Sauce']);
  });
});

describe('formatQty and scaling', () => {
  it('uses friendly fractions', () => {
    expect(formatQty(1.5)).toBe('1½');
    expect(formatQty(0.25)).toBe('¼');
    expect(formatQty(1 / 3)).toBe('⅓');
    expect(formatQty(12)).toBe('12');
    expect(formatQty(2.999)).toBe('3');
  });
  it('doubles when servings go 2 -> 4', () => {
    const line = parseIngredientLine('2 tbsps olive oil');
    expect(formatAmount(line, 2, 4)).toBe('4 tbsp');
  });
  it('scales 2 -> 3', () => {
    expect(formatAmount(parseIngredientLine('1 cup chicken broth'), 2, 3)).toBe('1½ cups');
  });
  it('never scales lines with no quantity', () => {
    expect(formatAmount(parseIngredientLine('salt to taste'), 2, 8)).toBe('');
  });
  it('pluralizes cloves', () => {
    expect(formatAmount(parseIngredientLine('3 cloves garlic'), 2, 4)).toBe('6 cloves');
    expect(formatAmount(parseIngredientLine('1 clove garlic'), 2, 2)).toBe('1 clove');
  });
});

import { ingredientsToText } from './ingredients';
describe('ingredientsToText', () => {
  it('round-trips through the parser', () => {
    const text = 'Salmon:\n1 lb salmon\n2 tbsp olive oil\nSauce:\n3 cloves garlic, minced\nsalt to taste';
    expect(ingredientsToText(parseIngredientBlock(text))).toBe(text);
  });
});
