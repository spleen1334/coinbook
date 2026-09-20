import { describe, expect, it } from 'vitest';
import { scrollDeltaToReveal, visibleAreaForControl } from './focusVisibility.js';

describe('scrollDeltaToReveal', () => {
  const visibleArea = { top: 100, bottom: 400 };

  it('does not scroll when the control is already within the usable area', () => {
    expect(scrollDeltaToReveal({ top: 160, bottom: 200 }, visibleArea)).toBe(0);
  });

  it('scrolls up when the control is above the usable area', () => {
    expect(scrollDeltaToReveal({ top: 72, bottom: 112 }, visibleArea)).toBe(-28);
  });

  it('scrolls down when the control would sit behind the sticky action area', () => {
    expect(scrollDeltaToReveal({ top: 376, bottom: 424 }, visibleArea)).toBe(24);
  });

  it('uses the nearest edge when a control is taller than the usable area', () => {
    expect(scrollDeltaToReveal({ top: 40, bottom: 460 }, visibleArea)).toBe(-60);
  });
});

describe('visibleAreaForControl', () => {
  const sheetRect = { top: 100, bottom: 500 };
  const actionsRect = { top: 420 };

  it('reserves the sticky action area while it is visible', () => {
    expect(visibleAreaForControl(sheetRect, actionsRect)).toEqual({ top: 108, bottom: 412 });
  });

  it('uses the full sheet height when memo entry hides the action area', () => {
    expect(visibleAreaForControl(sheetRect, null)).toEqual({ top: 108, bottom: 492 });
  });
});
