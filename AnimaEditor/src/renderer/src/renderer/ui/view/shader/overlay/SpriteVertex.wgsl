ShaderSetting {
  topologyType: strip,
}

import ViewCamera;

struct Setting {
  color: vec4<f32>
}

@bind(<uniform> camera: ViewCamera);
@bind(<storage, read> vertices: array<vec2<f32>>);
@bind(<uniform> setting: Setting);

struct VInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

const pointData = array<vec2<f32>, 4>(
  vec2<f32>(-1.0, -1.0), // 左下
  vec2<f32>(-1.0,  1.0), // 左上
  vec2<f32>( 1.0, -1.0), // 右下
  vec2<f32>( 1.0,  1.0), // 右上
);

const radius = 5.0;

@vertex
fn vmain(input : VInput) -> VOutput {
  var output : VOutput;
  let center = vertices[input.instanceIndex];
  let point = pointData[input.vertexIndex % 4u];
  let clipCenter = camera.vpM * vec3<f32>(center, 1.0);
  let offset = point * radius * camera.pixelToNDC;
  output.position = vec4<f32>(clipCenter.xy + offset, clipCenter.z, 1.0);
  output.texCoord = point * 0.5 + 0.5;
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
  let dist = pow(input.texCoord.x * 2.0 - 1.0, 2.0) + pow(input.texCoord.y * 2.0 - 1.0, 2.0);
  if (1.0 < dist) {
    discard ;
  }
  output.color = setting.color;
  return output;
}