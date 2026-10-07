import { Vec2Math, type Vec2, type Vec3 } from "../../util/vecMath";

export function createSilhouetteContains(vertices: Vec2[], edges: Vec2[]): (p: Vec2) => boolean {
  const epsilon = 1e-9;
  const point = (index: number): Vec2 => {
    if (!Number.isInteger(index) || !vertices[index]?.every(Number.isFinite)) throw new RangeError("Invalid vertex index");
    return vertices[index];
  };
  const boundary = edges.map(([a, b]) => [point(a), point(b)] as const);
  const onSegment = (p: Vec2, a: Vec2, b: Vec2): boolean =>
    Math.abs(Vec2Math.cross3(a, b, p)) <= epsilon &&
    p[0] >= Math.min(a[0], b[0]) - epsilon && p[0] <= Math.max(a[0], b[0]) + epsilon &&
    p[1] >= Math.min(a[1], b[1]) - epsilon && p[1] <= Math.max(a[1], b[1]) + epsilon;
  return (p: Vec2): boolean => {
    if (!p.every(Number.isFinite)) return false;
    let result = false;
    for (const [a, b] of boundary) {
      if (onSegment(p, a, b)) return true;
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
    }
    return result;
  };
}

// Filters whole triangles; it does not clip or triangulate crossing triangles.
export function cutSilhouetteOutTriangle(vertices: Vec2[], meshes: Vec3[], edges: Vec2[], strict = false): Vec3[] {
  const epsilon = 1e-9;
  const point = (index: number): Vec2 => {
    if (!Number.isInteger(index) || !vertices[index]?.every(Number.isFinite)) throw new RangeError("Invalid vertex index");
    return vertices[index];
  };
  const boundary = edges.map(([a, b]) => [point(a), point(b)] as const);
  const onSegment = (p: Vec2, a: Vec2, b: Vec2): boolean =>
    Math.abs(Vec2Math.cross3(a, b, p)) <= epsilon &&
    p[0] >= Math.min(a[0], b[0]) - epsilon && p[0] <= Math.max(a[0], b[0]) + epsilon &&
    p[1] >= Math.min(a[1], b[1]) - epsilon && p[1] <= Math.max(a[1], b[1]) + epsilon;
  const inside = createSilhouetteContains(vertices, edges);
  return meshes.filter(mesh => {
    const triangle = mesh.map(point);
    if (Math.abs(Vec2Math.cross3(triangle[0], triangle[1], triangle[2])) <= epsilon) return false;
    const center = Vec2Math.div(Vec2Math.add(triangle[0], Vec2Math.add(triangle[1], triangle[2])), [3, 3]);
    if (!inside(center)) return false;
    // CDT callers already constrain boundary edges; retain the inexpensive test.
    if (!strict) return true;
    if (!triangle.every(inside)) return false;
    for (let i = 0; i < 3; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3], direction = Vec2Math.sub(b, a);
      const length2 = direction[0] ** 2 + direction[1] ** 2;
      const cuts = [0, 1];
      for (const [c, d] of boundary) {
        const other = Vec2Math.sub(d, c), delta = Vec2Math.sub(c, a);
        const determinant = Vec2Math.cross(direction, other);
        if (Math.abs(determinant) > epsilon) {
          const t = Vec2Math.cross(delta, other) / determinant, u = Vec2Math.cross(delta, direction) / determinant;
          if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t);
        } else for (const p of [c, d]) if (onSegment(p, a, b)) {
          cuts.push(((p[0] - a[0]) * direction[0] + (p[1] - a[1]) * direction[1]) / length2);
        }
      }
      cuts.sort((a, b) => a - b);
      for (let j = 1; j < cuts.length; j++) {
        const t = (cuts[j - 1] + cuts[j]) / 2;
        if (!inside([a[0] + t * direction[0], a[1] + t * direction[1]])) return false;
      }
    }
    // A triangle can surround a complete hole without crossing any boundary.
    return !boundary.some(([p]) => {
      const signs = triangle.map((a, i) => Vec2Math.cross3(a, triangle[(i + 1) % 3], p));
      return signs.every(value => value > epsilon) || signs.every(value => value < -epsilon);
    });
  });
}
