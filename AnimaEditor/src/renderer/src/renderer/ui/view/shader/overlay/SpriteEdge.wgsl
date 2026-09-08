ShaderSetting {
  topologyType: strip,
}

import ViewCamera;

struct Setting {
  color: vec4<f32>
}

@bind(<uniform> camera: ViewCamera);
@bind(<storage, read> vertices: array<vec2<f32>>);
@bind(<storage, read> edges: array<vec2<u32>>);
@bind(<uniform> setting: Setting);

struct VInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

const radius = 1.0;

@vertex
fn vmain(input : VInput) -> VOutput {
  var output : VOutput;

  let edge = edges[input.instanceIndex];
  var position1 = vec2<f32>(0.0);
  var position2 = vec2<f32>(0.0);
  position1 = vertices[edge.x];
  position2 = vertices[edge.y];

  position1 = (camera.vpM * vec3<f32>(position1, 1.0)).xy;
  position2 = (camera.vpM * vec3<f32>(position2, 1.0)).xy;

  let sub = position2 - position1;
  let normal = normalize(vec2<f32>(-sub.y, sub.x)); // 仮の法線
  let offset = normal * radius * camera.pixelToNDC;

  var pos = vec2<f32>(0.0);
  if (input.vertexIndex == 0u) {
    pos = position1 - offset;
  } else if (input.vertexIndex == 1u) {
    pos = position1 + offset;
  } else if (input.vertexIndex == 2u) {
    pos = position2 - offset;
  } else {
    pos = position2 + offset;
  }

  output.position = vec4<f32>(pos, 0.0, 1.0);

  output.texCoord = vec2<f32>(0.0);
  return output;
}

struct FInput {
  @location(0) texCoord: vec2<f32>,
}

struct FOutput {
  @location(0) color: vec4<f32>,
}

@fragment
fn fmain(input : FInput) -> FOutput {
  var output : FOutput;
  output.color = setting.color;
  return output;
}