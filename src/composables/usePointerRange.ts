export function usePointerRange(min: number, max: number, onChange: (value: number) => void) {
  function update(event: PointerEvent) {
    const input = event.currentTarget as HTMLInputElement
    const bounds = input.getBoundingClientRect()
    if (!bounds.width) return
    const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
    onChange(Math.round(min + progress * (max - min)))
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const input = event.currentTarget as HTMLInputElement
    input.setPointerCapture(event.pointerId)
    update(event)
  }

  function onPointerMove(event: PointerEvent) {
    if ((event.currentTarget as HTMLInputElement).hasPointerCapture(event.pointerId)) update(event)
  }

  function onPointerEnd(event: PointerEvent) {
    const input = event.currentTarget as HTMLInputElement
    if (input.hasPointerCapture(event.pointerId)) input.releasePointerCapture(event.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerEnd }
}
