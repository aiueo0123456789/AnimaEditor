ShaderSetting {
  topologyType: list,
}

import ViewCamera;

@bind(<uniform> camera: ViewCamera);

struct VInput {
  @builtin(vertex_index) vertexIndex: u32
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

const vertices = array<vec2<f32>, 3>(
  vec2<f32>( 3.0,-1.0),
  vec2<f32>(-1.0, 3.0),
  vec2<f32>(-1.0,-1.0),
);

@vertex
fn vmain(input: VInput ) -> VOutput {
  var output: VOutput;
  let vertex = vertices[input.vertexIndex];
  output.position = vec4<f32>(vertex, 0.0, 1.0);
  output.texCoord = (camera.ivpM * vec3<f32>(vertex, 1.0)).xy;
  return output;
}

struct FInput {
  @location(0) texCoord: vec2<f32>,
}
struct FOutput {
    @location(0) color: vec4<f32>,
};

const gridSize = 10.0;

@fragment
fn fmain(input: FInput) -> FOutput {
  var output: FOutput;
  let x = select(input.texCoord.x, -input.texCoord.x, input.texCoord.x < 0.0) + gridSize / 2;
  let y = select(input.texCoord.y, -input.texCoord.y, input.texCoord.y < 0.0) + gridSize / 2;
  let value = select(0.2, 0.3, (floor(x / gridSize) % 2 + floor(y / gridSize) % 2) % 2 == 0);
  output.color = vec4<f32>(value, value, value, 1.0);
  return output;
}