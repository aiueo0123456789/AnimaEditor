ShaderSetting {
  topologyType: strip,
}

import ViewCamera;

struct Setting {
  center: vec2<f32>,
  radius: f32,
  angle: f32
}

@bind(<uniform> camera: ViewCamera);
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

const width = 0.05;

@vertex
fn vmain(input : VInput) -> VOutput {
  var output : VOutput;
  let center = setting.center;
  let point = pointData[input.vertexIndex % 4u];
  let clipCenter = camera.vpM * vec3<f32>(center, 1.0);
  let offset = point * setting.radius * camera.pixelToNDC;
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
const PI = 3.14;
fn is_point_in_sector(
  // テストする点（中心からの相対位置）
  point: vec2<f32>,
  // 扇の開始角度（ラジアン）
  start_angle: f32,
  // 扇の終了角度（ラジアン）
  end_angle: f32,
) -> bool {
  // ポイントの角度を計算（atan2を使用）
  let angle = atan2(point.y, point.x);
  // 角度を0～2πの範囲に正規化
  let normalized_angle = angle + select(0.0, 2.0 * PI, angle < 0.0);
  let normalized_start = start_angle + select(0.0, 2.0 * PI, start_angle < 0.0);
  let normalized_end = end_angle + select(0.0, 2.0 * PI, end_angle < 0.0);
  // 角度が開始角度と終了角度の間にあるかチェック
  if normalized_start <= normalized_end {
    return normalized_angle >= normalized_start && normalized_angle <= normalized_end;
  } else {
    // 開始角度が終了角度を超える場合（360度を跨ぐ場合）
    return normalized_angle >= normalized_start || normalized_angle <= normalized_end;
  }
}

@fragment
fn fmain(input : FInput) -> FOutput {
  var output : FOutput;
  let normalizedTexCoord = input.texCoord * 2.0 - 1.0;
  let dist = pow(normalizedTexCoord.x, 2.0) + pow(normalizedTexCoord.y, 2.0);
  if (pow(1.0, 2.0) < dist) {
    discard ;
  }
  if (pow(1.0 - width, 2.0) < dist) {
    output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
  } else {
    if (is_point_in_sector(normalizedTexCoord,0.0,setting.angle,)) {
      output.color = vec4<f32>(1.0, 0.0, 0.0, 0.3);
    } else {
      discard ;
    }
  }
  return output;
}