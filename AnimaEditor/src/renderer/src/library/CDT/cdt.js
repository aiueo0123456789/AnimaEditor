/**
 * 制約付きドロネー三角形分割 (Constrained Delaunay Triangulation)
 * 逐次加点法 + Sloan流のedge flipによる制約線分の復帰。
 * 参考: https://takashiijiri.com/study/miscs/DelaunayTriangulation.htm
 *
 * @param {number[][]} vertices 頂点座標
 * @param {number[][]} edges 制約線分
 * @returns {number[][]} 三角形の頂点
 */
export function cdt(vertices, edges) {
  const cnEdges = edges

  const key = (i, j) => (i < j ? `${i}_${j}` : `${j}_${i}`)

  function signedArea(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  }

  function pointInTriangle(p, a, b, c) {
    const d1 = signedArea(p, a, b)
    const d2 = signedArea(p, b, c)
    const d3 = signedArea(p, c, a)
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0
    return !(hasNeg && hasPos)
  }

  function isConvexQuad(p1, p2, p3, p4) {
    const c1 = signedArea(p1, p2, p3)
    const c2 = signedArea(p2, p3, p4)
    const c3 = signedArea(p3, p4, p1)
    const c4 = signedArea(p4, p1, p2)
    return (c1 > 0 && c2 > 0 && c3 > 0 && c4 > 0) || (c1 < 0 && c2 < 0 && c3 < 0 && c4 < 0)
  }

  function inCircumcircle(a, b, c, d) {
    let B = b,
      C = c
    if (signedArea(a, b, c) < 0) {
      B = c
      C = b
    }
    const ax = a[0] - d[0],
      ay = a[1] - d[1]
    const bx = B[0] - d[0],
      by = B[1] - d[1]
    const cx = C[0] - d[0],
      cy = C[1] - d[1]
    const det =
      (ax * ax + ay * ay) * (bx * cy - cx * by) -
      (bx * bx + by * by) * (ax * cy - cx * ay) +
      (cx * cx + cy * cy) * (ax * by - bx * ay)
    return det > 1e-9
  }

  function orientation(p, q, r) {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
    if (Math.abs(val) < 1e-12) return 0
    return val > 0 ? 1 : 2
  }
  function onSegment(p, q, r) {
    return (
      Math.min(p[0], r[0]) <= q[0] &&
      q[0] <= Math.max(p[0], r[0]) &&
      Math.min(p[1], r[1]) <= q[1] &&
      q[1] <= Math.max(p[1], r[1])
    )
  }

  function segmentsProperlyIntersect(p1, q1, p2, q2) {
    const o1 = orientation(p1, q1, p2)
    const o2 = orientation(p1, q1, q2)
    const o3 = orientation(p2, q2, p1)
    const o4 = orientation(p2, q2, q1)
    if (o1 !== o2 && o3 !== o4) return true
    if (o1 === 0 && onSegment(p1, p2, q1)) return true
    if (o2 === 0 && onSegment(p1, q2, q1)) return true
    if (o3 === 0 && onSegment(p2, p1, q2)) return true
    if (o4 === 0 && onSegment(p2, q1, q2)) return true
    return false
  }

  const triangles = new Map()
  const edgeTriangles = new Map()
  let nextId = 0

  function addEdgeTri(i, j, id) {
    const k = key(i, j)
    let s = edgeTriangles.get(k)
    if (!s) {
      s = new Set()
      edgeTriangles.set(k, s)
    }
    s.add(id)
  }
  function removeEdgeTri(i, j, id) {
    const k = key(i, j)
    const s = edgeTriangles.get(k)
    if (!s) return
    s.delete(id)
    if (s.size === 0) edgeTriangles.delete(k)
  }
  function addTriangle(a, b, c) {
    const id = nextId++
    triangles.set(id, [a, b, c])
    addEdgeTri(a, b, id)
    addEdgeTri(b, c, id)
    addEdgeTri(c, a, id)
    return id
  }
  function removeTriangle(id) {
    const [a, b, c] = triangles.get(id)
    removeEdgeTri(a, b, id)
    removeEdgeTri(b, c, id)
    removeEdgeTri(c, a, id)
    triangles.delete(id)
  }
  function trianglesOnEdge(i, j) {
    const s = edgeTriangles.get(key(i, j))
    return s ? [...s] : []
  }
  function thirdVertex(id, i, j) {
    const [a, b, c] = triangles.get(id)
    if (a !== i && a !== j) return a
    if (b !== i && b !== j) return b
    return c
  }

  const verts = vertices.slice()

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const [x, y] of vertices) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const dMax = Math.max(maxX - minX, maxY - minY, 1)
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  const superA = verts.length
  const superB = verts.length + 1
  const superC = verts.length + 2
  verts.push(
    [midX - 20 * dMax, midY - dMax],
    [midX, midY + 20 * dMax],
    [midX + 20 * dMax, midY - dMax]
  )
  addTriangle(superA, superB, superC)

  const constraintSet = new Set(cnEdges.map(([i, j]) => key(i, j)))
  const isConstraint = (i, j) => constraintSet.has(key(i, j))

  function legalize(stack) {
    let guard = 0
    const guardMax = 20000
    while (stack.length > 0) {
      if (++guard > guardMax) {
        console.warn('cdt: legalize() が想定回数を超えたため打ち切りました (flip cycle?)')
        break
      }
      const [A, B] = stack.pop()
      const tris = trianglesOnEdge(A, B)
      if (tris.length !== 2) continue
      const [t1, t2] = tris
      const C = thirdVertex(t1, A, B)
      const D = thirdVertex(t2, A, B)

      if (isConstraint(A, B)) continue

      const convex = isConvexQuad(verts[A], verts[C], verts[B], verts[D])
      let doFlip = false
      if (convex && isConstraint(C, D)) {
        doFlip = true
      } else if (convex && inCircumcircle(verts[A], verts[B], verts[C], verts[D])) {
        doFlip = true
      }

      if (doFlip) {
        removeTriangle(t1)
        removeTriangle(t2)
        addTriangle(A, C, D)
        addTriangle(B, D, C)
        stack.push([A, D], [D, B], [B, C], [C, A])
      }
    }
  }

  const EPS = 1e-9

  function isOnSegmentStrict(p, a, b) {
    if (Math.abs(signedArea(a, b, p)) > EPS) return false
    const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])
    const lenSq = (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
    return dot > EPS && dot < lenSq - EPS
  }

  function insertVertex(pIndex) {
    const p = verts[pIndex]
    let containingId = -1
    for (const [id, tri] of triangles) {
      const [a, b, c] = tri
      if (pointInTriangle(p, verts[a], verts[b], verts[c])) {
        containingId = id
        break
      }
    }
    if (containingId === -1) return

    const [A, B, C] = triangles.get(containingId)

    const edgesOfTri = [
      [A, B, C],
      [B, C, A],
      [C, A, B]
    ]
    for (const [E1, E2, Apex] of edgesOfTri) {
      if (!isOnSegmentStrict(p, verts[E1], verts[E2])) continue

      const neighborTris = trianglesOnEdge(E1, E2).filter((id) => id !== containingId)
      removeTriangle(containingId)
      addTriangle(E1, pIndex, Apex)
      addTriangle(pIndex, E2, Apex)
      const stack = [
        [E1, Apex],
        [Apex, E2]
      ]

      if (neighborTris.length === 1) {
        const neighborId = neighborTris[0]
        const Opp = thirdVertex(neighborId, E1, E2)
        removeTriangle(neighborId)
        addTriangle(E2, pIndex, Opp)
        addTriangle(pIndex, E1, Opp)
        stack.push([E2, Opp], [Opp, E1])
      }

      legalize(stack)
      return
    }

    removeTriangle(containingId)
    addTriangle(A, B, pIndex)
    addTriangle(B, C, pIndex)
    addTriangle(C, A, pIndex)
    legalize([
      [A, B],
      [B, C],
      [C, A]
    ])
  }

  const constrainedVerts = new Set(cnEdges.flat())
  for (const idx of constrainedVerts) {
    insertVertex(idx)
  }

  for (const [i, j] of cnEdges) {
    if (trianglesOnEdge(i, j).length > 0) continue

    const pi = verts[i],
      pj = verts[j]

    let K = []
    for (const k of edgeTriangles.keys()) {
      const [a, b] = k.split('_').map(Number)
      if (a === i || a === j || b === i || b === j) continue
      if (segmentsProperlyIntersect(pi, pj, verts[a], verts[b])) {
        K.push([a, b])
      }
    }

    const N = []
    let guard = 0
    const guardMax = 20000
    while (K.length > 0) {
      if (++guard > guardMax) {
        console.warn(`cdt: 制約線分 (${i}, ${j}) の復帰が想定回数を超えました`)
        break
      }
      const [C, D] = K.shift()
      const tris = trianglesOnEdge(C, D)
      if (tris.length !== 2) continue

      const [t1, t2] = tris
      const E = thirdVertex(t1, C, D)
      const F = thirdVertex(t2, C, D)

      if (isConvexQuad(verts[E], verts[C], verts[F], verts[D])) {
        removeTriangle(t1)
        removeTriangle(t2)
        addTriangle(C, E, F)
        addTriangle(D, F, E)
        N.push([E, F])
      } else {
        K.push([C, D])
      }
    }

    legalize(N)
  }

  for (let idx = 0; idx < vertices.length; idx++) {
    if (!constrainedVerts.has(idx)) {
      insertVertex(idx)
    }
  }

  const result = []
  for (const [a, b, c] of triangles.values()) {
    if (a >= vertices.length || b >= vertices.length || c >= vertices.length) continue
    result.push([a, b, c])
  }
  return result
}
