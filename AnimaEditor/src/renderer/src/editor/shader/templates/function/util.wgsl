fn rgbTohsv(c: vec3<f32>) -> vec3<f32> {
  let K = vec4<f32>(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  let p = mix(vec4<f32>(c.bg, K.wz), vec4<f32>(c.gb, K.xy), step(c.b, c.g));
  let q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));
  let d = q.x - min(q.w, q.y);
  let e = 1e-10;
  return vec3<f32>(
    abs(q.z + (q.w - q.y) / (6.0 * d + e)), // H
    d / (q.x + e),                         // S
    q.x                                    // V
  );
}

fn hsvTorgb(c: vec3<f32>) -> vec3<f32> {
  let K = vec4<f32>(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}

fn hsvAdjust(
  h: f32,
  s: f32,
  v: f32,
  fac: f32,
  color: vec3<f32>
) -> vec3<f32> {
  var hsv = rgbTohsv(color);
  hsv.x = fract(hsv.x + (h - 0.5));
  hsv.y = clamp(hsv.y * s, 0.0, 1.0);
  hsv.z = hsv.z * v;
  let adjusted = hsvTorgb(hsv);
  return mix(color, adjusted, fac);
}

fn brightnessContrast(
  color: vec3<f32>,
  brightness: f32,
  contrast: f32
) -> vec3<f32> {
  let a = 1.0 + contrast;          // contrastは-1〜1想定
  let b = brightness - contrast * 0.5;
  return a * color + vec3<f32>(b);
}

fn colorLamp(
  colors:  array<vec3<f32>, 4>,
  offsets: array<f32, 4>,
  count:   u32,   // 実際に使うストップ数(2〜4)
  t:       f32,
  kind:       u32 // 0一定 1リニア
) -> vec3<f32> {
  // countが範囲外なら最後の色を返す
  if (count < 2u) {
    return colors[0];
  }
  if (t <= offsets[0]) {
    return colors[0];
  }
  // 該当区間を探す
  for (var i = 0u; i < count - 1u; i++) {
    if (t <= offsets[i + 1u]) {
      let o1 = offsets[i];
      let o2 = offsets[i + 1u];
      if (abs(o2 - o1) < 1e-10) { return colors[i + 1u]; }
      let factor = saturate((t - o1) / (o2 - o1));
      if (kind == 0u) {
        return colors[i];
      } else {
        return mix(colors[i], colors[i + 1u], factor);
      }
    }
  }
  return colors[count - 1u]; // tがoffsets最大値を超えた場合
}

fn colorLampVec4(
  colors:  array<vec4<f32>, 4>,
  offsets: array<f32, 4>,
  count:   u32,   // 実際に使うストップ数(2〜4)
  t:       f32
) -> vec4<f32> {
  // countが範囲外なら最後の色を返す
  if (count < 2u) {
    return colors[0];
  }
  if (t <= offsets[0]) {
    return colors[0];
  }
  // 該当区間を探す
  for (var i = 0u; i < count - 1u; i++) {
    if (t <= offsets[i + 1u]) {
      let o1 = offsets[i];
      let o2 = offsets[i + 1u];
      if (abs(o2 - o1) < 1e-10) { return colors[i + 1u]; }
      let factor = saturate((t - o1) / (o2 - o1));
      return mix(colors[i], colors[i + 1u], factor);
    }
  }
  return colors[count - 1u]; // tがoffsets最大値を超えた場合
}

fn linearToSRGB(c: vec3<f32>) -> vec3<f32> {
  return pow(c, vec3<f32>(1.0 / 2.2));
}

fn nlerp(n1: vec3<f32>, n2: vec3<f32>, t: f32) -> vec3<f32> {
  return normalize(mix(n1, n2, t));
}

fn rangeMapping(x: f32, min: f32, max: f32, min_: f32, max_: f32) -> f32 {
  return (x - min) / (max - min) * (max_ - min_) + min_;
}

fn cmp(x: f32, t: f32, e: f32) -> f32 {
  return select(0.0, 1.0, abs(x - t) < e);
}

fn linearizeDepth(z: f32) -> f32 {
  return (camera.config.near * camera.config.far) / (camera.config.far - z * (camera.config.far - camera.config.near));
}

fn hash_u32(x: u32) -> u32 {
  var v = x;
  v = v * 747796405u + 2891336453u;

  var word = ((v >> ((v >> 28u) + 4u)) ^ v) * 277803737u;
  word = (word >> 22u) ^ word;

  return word;
}

fn random01(seed: u32) -> f32 {
  let h = hash_u32(seed);
  // 24bitを使ってfloatへ変換
  return f32(h >> 8u) * (1.0 / 16777216.0);
}