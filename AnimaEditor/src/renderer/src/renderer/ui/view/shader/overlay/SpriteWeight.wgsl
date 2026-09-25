ShaderSetting {
  topologyType: strip,
}

import ViewCamera;

@bind(<uniform> camera: ViewCamera);
@bind(<storage, read> vertices: array<vec2<f32>>);
@bind(<storage, read> weights: array<f32>);

struct VInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) @interpolate(flat) weight: f32,
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
  output.weight = weights[input.instanceIndex];
  return output;
}

struct FInput {
  @location(0) texCoord: vec2<f32>,
  @location(1) @interpolate(flat) weight: f32,
}

struct FOutput {
  @location(0) color: vec4<f32>,
}

// 重み(0〜1)を 青→シアン→緑→黄→赤 のヒートマップに変換
fn heatColor(t: f32) -> vec3<f32> {
  let c0 = vec3<f32>(0.0, 0.0, 1.0); // 青(低い)
  let c1 = vec3<f32>(0.0, 1.0, 1.0); // シアン
  let c2 = vec3<f32>(0.0, 1.0, 0.0); // 緑
  let c3 = vec3<f32>(1.0, 1.0, 0.0); // 黄
  let c4 = vec3<f32>(1.0, 0.0, 0.0); // 赤(高い)

  let x = clamp(t, 0.0, 1.0) * 4.0;
  if (x < 1.0) { return mix(c0, c1, x); }
  else if (x < 2.0) { return mix(c1, c2, x - 1.0); }
  else if (x < 3.0) { return mix(c2, c3, x - 2.0); }
  else { return mix(c3, c4, x - 3.0); }
}

@fragment
fn fmain(input : FInput) -> FOutput {
  var output : FOutput;
  // [setting.verticesNum * weightIndex + u32(input.vertexIndex)]重みの計算方法
  let dist = pow(input.texCoord.x * 2.0 - 1.0, 2.0) + pow(input.texCoord.y * 2.0 - 1.0, 2.0);
  if (1.0 < dist) {
    discard ;
  }
  output.color = vec4<f32>(heatColor(input.weight), 1.0);
  return output;
}