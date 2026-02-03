import { SM2_DEFAULT_EF } from '../types';

describe('baseline scaffolding', () => {
  it('exposes default SM-2 easiness factor', () => {
    expect(SM2_DEFAULT_EF).toBeGreaterThanOrEqual(1);
  });
});
