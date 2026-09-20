export function scrollDeltaToReveal(controlRect, visibleArea) {
  if (controlRect.top < visibleArea.top) return controlRect.top - visibleArea.top;
  if (controlRect.bottom > visibleArea.bottom) return controlRect.bottom - visibleArea.bottom;
  return 0;
}

export function visibleAreaForControl(sheetRect, actionsRect) {
  return {
    top: sheetRect.top + 8,
    bottom: Math.min(sheetRect.bottom - 8, actionsRect ? actionsRect.top - 8 : sheetRect.bottom - 8)
  };
}
