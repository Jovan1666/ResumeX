import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidPhone, validateField } from './useFormValidation';

describe('电话校验（去空格 +86）', () => {
  it('normalizePhone 去空格、去括号、去 +86', () => {
    expect(normalizePhone('138 0000 0000')).toBe('13800000000');
    expect(normalizePhone('138-0000-0000')).toBe('13800000000');
    expect(normalizePhone('+86 138 0000 0000')).toBe('13800000000');
    expect(normalizePhone('8613800000000')).toBe('13800000000');
  });

  it('isValidPhone 接受带空格格式，拒绝非法', () => {
    expect(isValidPhone('138 0000 0000')).toBe(true);
    expect(isValidPhone('+86 138 0000 0000')).toBe(true);
    expect(isValidPhone('12345678901')).toBe(false); // 12 开头非法
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('validateField phone 规则不吼用户（用清洗后的值）', () => {
    const err = validateField('138 0000 0000', { phone: true }, '电话');
    expect(err).toBeNull();
    const err2 = validateField('+86 138 0000 0000', { phone: true }, '电话');
    expect(err2).toBeNull();
    const err3 = validateField('200', { phone: true }, '电话');
    expect(err3).not.toBeNull();
  });
});
