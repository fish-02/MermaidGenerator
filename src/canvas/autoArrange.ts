export interface OverlapBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

const MAX_ITERATIONS = 300

/** Mutates each box's x/y in place, nudging overlapping boxes apart until at least `gap` px separates them. */
export function resolveOverlaps(boxes: OverlapBox[], gap: number): void {
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let anyOverlap = false

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]

        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + gap
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + gap
        if (overlapX <= 0 || overlapY <= 0) continue

        anyOverlap = true
        if (overlapX < overlapY) {
          const sign = a.x + a.width / 2 <= b.x + b.width / 2 ? -1 : 1
          a.x += (sign * overlapX) / 2
          b.x -= (sign * overlapX) / 2
        } else {
          const sign = a.y + a.height / 2 <= b.y + b.height / 2 ? -1 : 1
          a.y += (sign * overlapY) / 2
          b.y -= (sign * overlapY) / 2
        }
      }
    }

    if (!anyOverlap) break
  }
}
