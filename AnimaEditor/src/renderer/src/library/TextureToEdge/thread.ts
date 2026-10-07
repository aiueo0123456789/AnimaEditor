import { Vec2Math, type Vec2 } from "../../util/vecMath";

export interface ContourOptions {
  pixelDensity: number;
  padding: number;
  simplEpsilon: number;
  option: "center" | "bottomLeft";
}
export interface ContourResult { vertices: Vec2[]; edges: Vec2[]; }
export interface ContourRequest {
  masks: Uint32Array<ArrayBuffer>;
  width: number;
  height: number;
  options: ContourOptions;
}
export type ContourResponse = { result: ContourResult } | { error: string };

export function validateOptions(options: ContourOptions): void {
  if (!Number.isFinite(options.pixelDensity) || options.pixelDensity <= 0) throw new RangeError("pixelDensity must be positive");
  if (!Number.isFinite(options.padding)) throw new RangeError("padding must be finite");
  if (!Number.isFinite(options.simplEpsilon) || options.simplEpsilon < 0) throw new RangeError("simplEpsilon must be non-negative");
  if (!["center", "bottomLeft"].includes(options.option)) throw new RangeError("Unknown coordinate origin");
}

// T, R, B, L edge midpoints. Interior stays on the right in image coordinates.
// The two saddle cases keep diagonally touching opaque pixels disconnected.
const segments: readonly (readonly number[])[] = [
  [], [0, 3], [1, 0], [1, 3], [2, 1], [0, 3, 2, 1], [2, 0], [2, 3],
  [3, 2], [0, 2], [1, 0, 3, 2], [1, 2], [3, 1], [0, 1], [3, 0], [],
];
const area = (points: Vec2[]): number => points.reduce((sum, p, i) => sum + Vec2Math.cross(p, points[(i + 1) % points.length]), 0) / 2;

function simplifyChain(points: Vec2[], epsilon: number): Vec2[] {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    const a = points[first], delta = Vec2Math.sub(points[last], a);
    const length2 = delta[0] ** 2 + delta[1] ** 2;
    let farthest = -1, max = epsilon ** 2;
    for (let i = first + 1; i < last; i++) {
      const p = Vec2Math.sub(points[i], a);
      const t = length2 ? Math.max(0, Math.min(1, (p[0] * delta[0] + p[1] * delta[1]) / length2)) : 0;
      const d = (p[0] - t * delta[0]) ** 2 + (p[1] - t * delta[1]) ** 2;
      if (d > max) { max = d; farthest = i; }
    }
    if (farthest >= 0) { keep[farthest] = 1; stack.push([first, farthest], [farthest, last]); }
  }
  return points.filter((_, i) => keep[i]);
}

function simplifyRing(points: Vec2[], epsilon: number): Vec2[] {
  const corners = points.filter((p, i) => Vec2Math.cross3(points[(i + points.length - 1) % points.length], p, points[(i + 1) % points.length]) !== 0);
  if (!epsilon || corners.length <= 3) return corners;
  let split = 1, distance = 0;
  for (let i = 1; i < corners.length; i++) {
    const d = Vec2Math.distance(corners[0], corners[i]);
    if (d > distance) { distance = d; split = i; }
  }
  const candidate = simplifyChain(corners.slice(0, split + 1), epsilon).slice(0, -1)
    .concat(simplifyChain(corners.slice(split).concat([corners[0]]), epsilon).slice(0, -1));
  return candidate.length >= 3 && area(candidate) * area(corners) > 0 ? candidate : corners;
}

function offsetRing(points: Vec2[], padding: number): Vec2[] | null {
  if (!padding) return points;
  const moved: Vec2[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const incoming = Vec2Math.normalize(Vec2Math.sub(point, points[(i + points.length - 1) % points.length]));
    const outgoing = Vec2Math.normalize(Vec2Math.sub(points[(i + 1) % points.length], point));
    const normal: Vec2 = [incoming[1] + outgoing[1], -incoming[0] - outgoing[0]];
    const denominator = 1 + incoming[0] * outgoing[0] + incoming[1] * outgoing[1];
    if (denominator < 1e-8) return null;
    // Bound sharp-corner miters rather than producing arbitrarily distant vertices.
    const factor = Math.min(1 / denominator, 4 / Math.max(Vec2Math.length(normal), 1e-8));
    moved.push(Vec2Math.add(point, [normal[0] * padding * factor, normal[1] * padding * factor]));
  }
  if (moved.some(point => !point.every(Number.isFinite))) throw new RangeError("Padding exceeds coordinate range");
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const before = Vec2Math.sub(points[j], points[i]), after = Vec2Math.sub(moved[j], moved[i]);
    // A positive offset closes small holes; a negative offset removes small
    // islands. Both are valid topology changes, so discard the vanished ring.
    if (before[0] * after[0] + before[1] * after[1] <= 0) return null;
  }
  if (area(points) * area(moved) <= 0) return null;
  return moved;
}

function contains(point: Vec2, ring: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

// X-sorted bounds skip distant edges; adjacent edges of a ring are allowed to meet.
function intersects(rings: Vec2[][]): boolean {
  const edges = rings.flatMap((ring, r) => ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length];
    return { a, b, r, i, minX: Math.min(a[0], b[0]), maxX: Math.max(a[0], b[0]), minY: Math.min(a[1], b[1]), maxY: Math.max(a[1], b[1]) };
  })).sort((a, b) => a.minX - b.minX);
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i];
    for (let j = i + 1; j < edges.length && edges[j].minX <= a.maxX; j++) {
      const b = edges[j];
      if (a.maxY < b.minY || b.maxY < a.minY) continue;
      if (a.r === b.r && (Math.abs(a.i - b.i) === 1 || Math.abs(a.i - b.i) === rings[a.r].length - 1)) continue;
      if (Vec2Math.cross3(a.a, a.b, b.a) * Vec2Math.cross3(a.a, a.b, b.b) <= 0 &&
          Vec2Math.cross3(b.a, b.b, a.a) * Vec2Math.cross3(b.a, b.b, a.b) <= 0) return true;
    }
  }
  return false;
}

export function contoursFromMasks(masks: Uint32Array, width: number, height: number, options: ContourOptions): ContourResult {
  validateOptions(options);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || masks.length !== (width + 1) * (height + 1)) throw new RangeError("Invalid contour grid");
  if (!Number.isFinite(width / options.pixelDensity + height / options.pixelDensity)) throw new RangeError("pixelDensity exceeds coordinate range");
  const stride = 2 * width + 3;
  const next = new Map<number, number>();
  for (let index = 0; index < masks.length; index++) {
    const entry = segments[masks[index]];
    if (!entry) throw new RangeError("Invalid marching squares mask");
    if (!entry.length) continue;
    const x = index % (width + 1), y = Math.floor(index / (width + 1));
    const points = [(2 * y) * stride + 2 * x + 1, (2 * y + 1) * stride + 2 * x + 2,
      (2 * y + 2) * stride + 2 * x + 1, (2 * y + 1) * stride + 2 * x];
    for (let i = 0; i < entry.length; i += 2) next.set(points[entry[i]], points[entry[i + 1]]);
  }
  const rings: Vec2[][] = [];
  while (next.size) {
    const start = next.keys().next().value!;
    let current = start;
    const ring: Vec2[] = [];
    do {
      const target = next.get(current);
      if (target === undefined) throw new Error("Contour is not closed");
      next.delete(current);
      // Samples are pixel centers; boundary midpoints land on pixel edges.
      ring.push([(current % stride - 1) / (2 * options.pixelDensity), (Math.floor(current / stride) - 1) / (2 * options.pixelDensity)]);
      current = target;
    } while (current !== start);
    rings.push(ring);
  }
  const corners = rings.map(ring => simplifyRing(ring, 0));
  let simplified = options.simplEpsilon ? corners.map(ring => simplifyRing(ring, options.simplEpsilon)) : corners;
  const changed = simplified.map((ring, i) => ring.length !== corners[i].length || ring.some((point, j) => point !== corners[i][j]));
  // Tiny islands often cannot simplify. Avoid a quadratic nesting pass for them.
  if (changed.some(Boolean) && (intersects(simplified) || rings.some((ring, i) => rings.some((other, j) =>
    i !== j && (changed[i] || changed[j]) && contains(ring[0], other) !== contains(simplified[i][0], simplified[j]))))) {
    simplified = corners;
  }
  const padded = simplified.map(ring => offsetRing(ring, options.padding))
    .filter((ring): ring is Vec2[] => ring !== null);
  if (options.padding && intersects(padded)) throw new RangeError("Padding intersects contours; reduce padding");
  const size: Vec2 = [width / options.pixelDensity, height / options.pixelDensity];
  const result: ContourResult = { vertices: [], edges: [] };
  for (const ring of padded) {
    const offset = result.vertices.length;
    ring.forEach((point, i) => {
      const position = Vec2Math.flipY(point, size[1]);
      result.vertices.push(options.option === "center" ? Vec2Math.sub(position, [size[0] / 2, size[1] / 2]) : position);
      result.edges.push([offset + i, offset + (i + 1) % ring.length]);
    });
  }
  return result;
}

// This module is also imported for validation/CPU tests. Never install a handler
// on the main window (or when imported in Node).
if (typeof self !== "undefined" && typeof document === "undefined") {
  self.onmessage = (event: MessageEvent<ContourRequest>): void => {
    let response: ContourResponse;
    try {
      const { masks, width, height, options } = event.data;
      response = { result: contoursFromMasks(masks, width, height, options) };
    } catch (error) {
      response = { error: error instanceof Error ? error.message : String(error) };
    }
    self.postMessage(response);
  };
}
