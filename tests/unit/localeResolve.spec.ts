import { describe, it, expect } from 'vitest';
import { detectBrowserLocale, resolveLocale } from '@/i18n/localeResolve';

describe('localeResolve', () => {
  it('detects Chinese variants as zh-CN', () => {
    expect(detectBrowserLocale('zh')).toBe('zh-CN');
    expect(detectBrowserLocale('zh-CN')).toBe('zh-CN');
    expect(detectBrowserLocale('zh-TW')).toBe('zh-CN');
    expect(detectBrowserLocale('zh-Hans-CN')).toBe('zh-CN');
  });

  it('detects non-Chinese as en', () => {
    expect(detectBrowserLocale('en')).toBe('en');
    expect(detectBrowserLocale('en-US')).toBe('en');
    expect(detectBrowserLocale('de-DE')).toBe('en');
    expect(detectBrowserLocale(undefined)).toBe('en');
    expect(detectBrowserLocale('')).toBe('en');
  });

  it('resolveLocale respects explicit preference over browser', () => {
    expect(resolveLocale('en', 'zh-CN')).toBe('en');
    expect(resolveLocale('zh-CN', 'en-US')).toBe('zh-CN');
  });

  it('resolveLocale auto uses browser detection', () => {
    expect(resolveLocale('auto', 'zh-TW')).toBe('zh-CN');
    expect(resolveLocale('auto', 'fr-FR')).toBe('en');
  });
});
