export interface Pie3DPart {
  start: number
  end: number
  delta: number
  top: string
  back?: string
  ribbon?: string
}

const DEG = Math.PI / 180

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function point(cx: number, cy: number, rx: number, ry: number, phi: number, dy: number): [number, number] {
  const a = normalize(phi) * DEG
  return [round2(cx + rx * Math.sin(a)), round2(cy + dy - ry * Math.cos(a))]
}

function arcSector(cx: number, cy: number, rx: number, ry: number, a: number, b: number): string {
  const [ax, ay] = point(cx, cy, rx, ry, a, 0)
  const [bx, by] = point(cx, cy, rx, ry, b, 0)
  const large = b - a > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${ax} ${ay} A ${rx} ${ry} 0 ${large} 1 ${bx} ${by} Z`
}

function ribbonPath(cx: number, cy: number, rx: number, ry: number, depth: number, a: number, b: number): string {
  const [tax, tay] = point(cx, cy, rx, ry, a, 0)
  const [tbx, tby] = point(cx, cy, rx, ry, b, 0)
  const [bax, bay] = point(cx, cy, rx, ry, a, depth)
  const [bbx, bby] = point(cx, cy, rx, ry, b, depth)
  const large = b - a > 180 ? 1 : 0
  return `M ${tax} ${tay} L ${bax} ${bay} A ${rx} ${ry} 0 ${large} 1 ${bbx} ${bby} L ${tbx} ${tby} A ${rx} ${ry} 0 ${large} 0 ${tax} ${tay} Z`
}

function slicePortion(s: number, e: number, low: number, high: number): [number, number] | null {
  const k = Math.floor((s - low) / 360)
  for (let i = 0; i < 2; i += 1) {
    const a = low + 360 * (k + i)
    const b = high + 360 * (k + i)
    const lo = Math.max(s, a)
    const hi = Math.min(e, b)
    if (hi > lo) return [lo, hi]
  }
  return null
}

export function pie3dGeometry(
  values: number[],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  depth: number,
): Pie3DPart[] {
  const total = values.reduce((acc, v) => acc + Math.max(0, v), 0)
  if (total <= 0 || values.length === 0) return []

  const parts: Pie3DPart[] = []
  let cursor = -90
  const single = values.filter(v => v > 0).length === 1

  values.forEach(v => {
    const value = Math.max(0, v)
    if (value <= 0) return
    const delta = single ? 360 : (value / total) * 360
    const s = cursor
    const e = cursor + delta
    const sC = normalize(s)

    const back = slicePortion(s, e, 270, 450)
    const front = slicePortion(s, e, 90, 270)

    const top =
      delta >= 360
        ? `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 1 ${2 * rx} 0 a ${rx} ${ry} 0 1 1 ${-2 * rx} 0 Z`
        : arcSector(cx, cy, rx, ry, sC, sC + delta)

    parts.push({
      start: sC,
      end: sC + delta,
      delta,
      top,
      back: back ? arcSector(cx, cy, rx, ry, back[0], back[1]) : undefined,
      ribbon: front ? ribbonPath(cx, cy, rx, ry, depth, front[0], front[1]) : undefined,
    })
    cursor = e
  })

  return parts
}
