export function scrollDeltaToReveal(controlRect, visibleArea) {
  if (controlRect.top < visibleArea.top) return controlRect.top - visibleArea.top;
  if (controlRect.bottom > visibleArea.bottom) return controlRect.bottom - visibleArea.bottom;
  return 0;
}
