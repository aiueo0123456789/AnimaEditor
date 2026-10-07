ShaderSetting {
  topologyType: list,
}

import ViewCamera;

struct Parms {
  alpha: f32,
  maskType: u32,
  maskStrength: f32,
  padding: f32,
}

@bind(<uniform> camera: ViewCamera);
@bind(<uniform> parms: Parms);
@bind(colorTexture: texture_2d<f32>);
@bind(maskTexture: texture_2d<f32>);
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
  @builtin(position) position: vec4<f32>,
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
  let maskSize = textureDimensions(maskTexture);
  let maskPosition = clamp(vec2<i32>(input.position.xy), vec2<i32>(0), vec2<i32>(maskSize) - vec2<i32>(1));
  let coverage = textureLoad(maskTexture, maskPosition, 0).r;
  let masked = select(coverage, 1.0 - coverage, parms.maskType == 1u);
  let amount = select(mix(1.0, masked, parms.maskStrength), 1.0, parms.maskType == 2u);
  output.color = textureSample(colorTexture, mySampler, input.texCoord);
  output.color.a *= parms.alpha * amount;
  return output;
}
