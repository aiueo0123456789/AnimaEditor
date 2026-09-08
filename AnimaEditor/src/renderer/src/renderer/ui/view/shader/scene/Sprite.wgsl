ShaderSetting {
  topologyType: list,
}

import ViewCamera;

@bind(<uniform> camera: ViewCamera);
@bind(colorTexture: texture_2d<f32>);
@bind(mySampler: sampler);

struct VInput {
  @location(0) position: vec2<f32>,
  @location(1) texCoord: vec2<f32>,
}

struct VOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

@vertex
fn vmain(input : VInput) -> VOutput {
  var output : VOutput;
  output.position = vec4<f32>(camera.vpM * vec3<f32>(input.position, 1.0), 1.0);
  output.texCoord = input.texCoord;
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
  if (input.texCoord.x < 0.0 || 1.0 < input.texCoord.x ||
    input.texCoord.y < 0.0 || 1.0 < input.texCoord.y) {
    discard ;
  }
  output.color = textureSample(colorTexture, mySampler, input.texCoord);
  return output;
}