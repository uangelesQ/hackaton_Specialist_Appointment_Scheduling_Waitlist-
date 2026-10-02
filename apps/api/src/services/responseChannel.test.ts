import { describe, expect, it } from 'vitest';
import { responseChannelOf } from './responseChannel.js';

describe('responseChannelOf (1.2)', () => {
  it('lets an in-app patient answer in the app', () => {
    expect(responseChannelOf('in_app')).toBe('in_app');
  });

  it('has staff answer for a telephone patient', () => {
    expect(responseChannelOf('telephone')).toBe('staff');
  });

  it('treats a patient with no recorded preference as telephone', () => {
    expect(responseChannelOf(null)).toBe('staff');
  });
});
