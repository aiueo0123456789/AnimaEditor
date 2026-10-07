# Texture To Edge

Implementation has two source files:
- textureToEdge.ts: typed public API, GPU dispatch/readback, worker lifecycle.
- thread.ts: contour algorithms, message types and guarded worker entry point.

The legacy createMeshSubThread.js used the same marching-squares lookup idea,
but sent chunks to one worker and returned only segments. The current worker
handles a complete extraction, including stitching, simplification and padding.
Cases 5/10 intentionally keep diagonal opaque pixels separate, unlike the legacy
lookup's connected-foreground policy. Legacy code was consolidated, not retained
as a second competing implementation.

`createEdgeFromTexture(texture, pixelDensity = 1, padding = 0,
simplEpsilon = 5, option = 'center', { signal } = {})` returns
`{ vertices, edges }`. Indices address the returned vertices, not Model IDs.
The input texture remains owned by the caller.

- Density is pixels per editor unit. Padding and epsilon use editor units.
- Positions use Y-up, with `center` or `bottomLeft` origin. UVs are not returned.
- Alpha strictly greater than 0.05 is opaque. Supported inputs are single-layer,
  single-sample 2D rgba8unorm/bgra8unorm (including sRGB) or rgba16float textures
  with TEXTURE_BINDING usage. Mip level zero is used.
- All islands and holes survive extraction; diagonally touching pixels remain
  separate. Marching squares bevels pixel corners by half a pixel.
- Closed contours use iterative simplification. Invalid simplifications fall
  back to collinear-point removal. Small loops are not reduced below 3 points.
- Padding is a bounded miter offset, not a polygon-boolean operation. Collapsed
  or intersecting offsets are rejected; use smaller padding. It does not merge
  overlapping islands or intentionally erase holes.
- GPU pipelines are cached per device, buffers are released in finally, and
  each request terminates its own module worker on success, error or abort.
  Cancellation during GPU readback is observed when mapAsync settles.

The old import-time MarchingSquaresPipeline export and missing external worker
were removed. No in-repository callers depended on that pipeline export.

`cutSilhouetteOutTriangle` filters whole triangles, including triangles spanning
concavities or holes. It does not clip them. The shared CDT helper retains its
fast centroid path by default for already boundary-constrained triangulations;
this module opts into its strict boundary checks.

## Performance

Contour stitching uses numeric endpoint keys and linear traversal rather than
repeated full scans/splices. Empty/full cells allocate no edge records, one
readback is transferred to the worker without another message-level copy, and
simplification uses an explicit stack instead of recursive array splitting.

Remaining scaling opportunities: GPU edge compaction (currently 4 bytes per
cell), a bounded worker pool for many small requests, and a spatial index for
intersection/nesting and strict triangle filtering. Intersection checks and
Douglas-Peucker retain quadratic worst cases; strict triangle filtering can
also be expensive on dense boundaries. Benchmark actual assets before adding
these layers. GPU allocation is checked against device buffer limits.

Tests: `node --test tests/texture-to-edge.test.cjs`; GPU/worker checks:
`tests/ui/texture-to-edge.test.cjs` against the Vite test page.

## Editor Tool

In VERTEX mode, choose the silhouette generation tool and click the viewport.
It samples the active Sprite's loaded texture with density 1, padding 0 and
epsilon 1, then maps the pixel coordinates into the Sprite's textureRect.
A zero-sized textureRect is initialized to the centered pixel dimensions.
All existing vertices are replaced with freshly identified contour vertices.
Ordinary edges, vertex weights and Sprite vertex animation path mappings are
cleared in the same command. Bone weight groups themselves are retained.
Shared animation tracks themselves are not deleted. Silhouette edges are replaced.
An entirely transparent texture leaves the Sprite unchanged.

Geometry and selection changes form one undoable command. Switching tools,
cancelling, changing the target or changing source geometry during extraction
prevents the pending result from being applied. UVs remain the responsibility
of System_Init_Sprite. Silhouette edges also constrain runtime triangulation.
