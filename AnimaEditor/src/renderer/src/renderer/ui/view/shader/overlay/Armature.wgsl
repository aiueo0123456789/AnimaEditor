ShaderSetting {
  topologyType: strip,
}

import ViewCamera;

struct Bone {
  position: vec2<f32>,
  scale:    vec2<f32>,
  rotation: f32,
  length:   f32,
}

@bind(<uniform> camera: ViewCamera);
@bind(<storage, read> bones: array<Bone>);

struct VInput {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) position: vec2<f32>, // ユニットボーン形状
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
}

fn rotate2d(v: vec2<f32>, angle: f32) -> vec2<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec2<f32>(
    c * v.x - s * v.y,
    s * v.x + c * v.y
  );
}

@vertex
fn vmain(input: VInput) -> VOutput {
  let bone = bones[input.instanceIndex];
  // x: length方向, y: 太さ(scaleで調整)
  var local = input.position * vec2<f32>(bone.length * bone.scale.x, bone.length * bone.scale.y);

  local = rotate2d(local, bone.rotation) + bone.position;

  var out: VOutput;
  out.position = vec4<f32>((camera.vpM * vec3<f32>(local, 1.0)).xy, 0.0, 1.0);
  return out;
}

struct FInput {
  @builtin(position) position: vec4<f32>,
}

struct FOutput {
  @location(0) color: vec4<f32>,
}

@fragment
fn fmain(input : FInput) -> FOutput {
  var output : FOutput;
  output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
  return output;
}