struct ViewCamera {
  vpM: mat3x3<f32>,
  ivpM: mat3x3<f32>,
  pixelToNDC: vec2<f32>,
  padding: vec2<f32>
}