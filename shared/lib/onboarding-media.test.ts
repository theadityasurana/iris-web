import { describe, expect, test } from 'bun:test';
import { classifyOnboardingMediaUri } from './onboarding-media';

describe('classifyOnboardingMediaUri', () => {
  test('treats StepResume storage filenames as storage keys, not fetchable URLs', () => {
    expect(classifyOnboardingMediaUri('1712345678.pdf')).toEqual({
      kind: 'storage-key',
      fileName: '1712345678.pdf',
    });
  });

  test('keeps remote URLs as remote', () => {
    expect(classifyOnboardingMediaUri('https://cdn.example/resume.pdf')).toEqual({
      kind: 'remote',
      url: 'https://cdn.example/resume.pdf',
    });
  });

  test('keeps iOS photo picker URIs as local', () => {
    expect(classifyOnboardingMediaUri('file:///var/mobile/resume.jpg')).toEqual({
      kind: 'local',
      uri: 'file:///var/mobile/resume.jpg',
    });
    expect(classifyOnboardingMediaUri('ph://ABC-123')).toEqual({
      kind: 'local',
      uri: 'ph://ABC-123',
    });
  });

  test('returns none for empty values', () => {
    expect(classifyOnboardingMediaUri(null)).toEqual({ kind: 'none' });
    expect(classifyOnboardingMediaUri('')).toEqual({ kind: 'none' });
  });
});
