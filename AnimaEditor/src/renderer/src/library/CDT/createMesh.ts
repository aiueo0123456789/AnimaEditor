import { Vec2, Vec2Math, Vec3 } from "../../util/vecMath";

export function cutSilhouetteOutTriangle(vertices: Vec2[], meshes: Vec3[], edges: Vec2[]) {
  const isPointInsidePolygon = (point) => {
    let vecCross3ings = 0;
    const x = point[0];
    const y = point[1];
    for (let i = 0; i < edges.length; i++) {
      const p0 = vertices[edges[i][0]];
      const p1 = vertices[edges[i][1]];
      if (y > Math.min(p1[1], p0[1]) && y <= Math.max(p1[1], p0[1])) {
        const xIntersect =
          ((y - p1[1]) * (p0[0] - p1[0])) / (p0[1] - p1[1]) + p1[0];

        if (xIntersect > x) {
          vecCross3ings++;
        }
      }
    }
    return vecCross3ings % 2 === 1;
  };

  const result: Vec3[] = [];
  for (const mesh of meshes) {
    const centerPoint = Vec2Math.div(Vec2Math.add(
      vertices[mesh[0]],
      Vec2Math.add(
        vertices[mesh[1]],
        vertices[mesh[2]],
      )
    ), Vec2Math.create(3, 3));
    if (isPointInsidePolygon(centerPoint)) {
      result.push(mesh);
    }
  }
  return result;
}
