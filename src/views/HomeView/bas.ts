const BAS: any = {}

BAS.ShaderChunk = {}

BAS.ShaderChunk['animation_time'] =
  'float tDelay = aAnimation.x;\nfloat tDuration = aAnimation.y;\nfloat tTime = clamp(uTime - tDelay, 0.0, tDuration);\nfloat tProgress = ease(tTime, 0.0, 1.0, tDuration);\n'

BAS.ShaderChunk['catmull-rom'] =
  'vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t)\n{\n    vec3 v0 = (p2 - p0) * 0.5;\n    vec3 v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nvec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, vec2 c, float t)\n{\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, float t)\n{\n    float v0 = (p2 - p0) * 0.5;\n    float v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, vec2 c, float t)\n{\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n'

BAS.ShaderChunk['cubic_bezier'] =
  'vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)\n{\n    vec3 tp;\n    float tn = 1.0 - t;\n\n    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;\n\n    return tp;\n}\n'

BAS.ShaderChunk['ease_in_cubic'] =
  'float ease(float t, float b, float c, float d) {\n  return c*(t/=d)*t*t + b;\n}\n'

BAS.ShaderChunk['ease_in_out_cubic'] =
  'float ease(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;\n  return c/2.0*((t-=2.0)*t*t + 2.0) + b;\n}\n'

BAS.ShaderChunk['ease_in_quad'] =
  'float ease(float t, float b, float c, float d) {\n  return c*(t/=d)*t + b;\n}\n'

BAS.ShaderChunk['ease_out_back'] =
  'float ease(float t, float b, float c, float d) {\n  float s = 1.70158;\n  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;\n}\n\nfloat ease(float t, float b, float c, float d, float s) {\n  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;\n}\n'

BAS.ShaderChunk['ease_out_cubic'] =
  'float ease(float t, float b, float c, float d) {\n  return c*((t=t/d - 1.0)*t*t + 1.0) + b;\n}\n'

BAS.ShaderChunk['quaternion_rotation'] =
  'vec3 rotateVector(vec4 q, vec3 v)\n{\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n\nvec4 quatFromAxisAngle(vec3 axis, float angle)\n{\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n'

export default BAS

export const vertexShader = `
#define PI 3.14159
#define PI2 6.28318
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	float distance = dot( planeNormal, point - pointOnPlane );
	return - distance * planeNormal + point;
}
float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return sign( dot( point - pointOnPlane, planeNormal ) );
}
vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
}

#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	varying vec2 vUv;
	uniform vec4 offsetRepeat;
#endif

vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)
{
    vec3 tp;
    float tn = 1.0 - t;

    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;

    return tp;
}

float ease(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;
  return c/2.0*((t-=2.0)*t*t + 2.0) + b;
}

vec3 rotateVector(vec4 q, vec3 v)
{
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

vec4 quatFromAxisAngle(vec3 axis, float angle)
{
    float halfAngle = angle * 0.5;
    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));
}

uniform float uTime;
attribute vec2 aAnimation;
attribute vec3 aStartPosition;
attribute vec3 aControl0;
attribute vec3 aControl1;
attribute vec3 aEndPosition;
void main() {
  float tDelay = aAnimation.x;
  float tDuration = aAnimation.y;
  float tTime = clamp(uTime - tDelay, 0.0, tDuration);
  float tProgress = ease(tTime, 0.0, 1.0, tDuration);

  #if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
    vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
  #endif

  vec3 transformed = vec3( position );

  transformed *= 1.0 - tProgress;
  transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);

  #ifdef USE_SKINNING
    vec4 mvPosition = modelViewMatrix * skinned;
  #else
    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  #endif

  gl_Position = projectionMatrix * mvPosition;
}
`
// https://discourse.threejs.org/t/threejs-r111-it-normal-but-threejs-r131-it-error-using-shadermaterial-error-maptexeltolinear-no-matching/29544/7
export const fragmentShader = `
uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>

vec4 lineartoLinear( in vec4 value) {
  return value;
}

vec4 mapTexelToLinear(vec4 value) {
  return lineartoLinear(value);
}
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight;
	reflectedLight.directDiffuse = vec3( 0.0 );
	reflectedLight.directSpecular = vec3( 0.0 );
	reflectedLight.indirectDiffuse = diffuseColor.rgb;
	reflectedLight.indirectSpecular = vec3( 0.0 );
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}
`


const getCentroidsForTriangles = (bufferGeometry: THREE.BufferGeometry): THREE.Vector3[] => {
  const indices = bufferGeometry.index!.array // 可能是 undefined, 需要确保存在
  const positions = bufferGeometry.getAttribute('position').array as number[]

  const centroids: THREE.Vector3[] = []

  // 遍历索引数组，过滤掉非三角形面
  for (let i = 0; i < indices.length; i += 3) {
    // 确保每面是三角形（3个顶点）
    if (i + 2 < indices.length) {
      const centroid = computeCentroid(indices, positions, i)
      centroids.push(centroid)
    }
  }

  return centroids
}

// 处理BufferGeometry，剔除非三角面并计算三角形面的质心
export const filterAndComputeCentroids = (
  bufferGeometry: THREE.BufferGeometry,
): THREE.Vector3[] => {
  const indices = bufferGeometry.index!.array // 获取索引数组
  const positions = bufferGeometry.getAttribute('position').array as number[]

  // 重新组织索引数组，仅保留三角面
  const filteredIndices: number[] = []

  for (let i = 0; i < indices.length; i += 3) {
    // 检查面是否是三角形（每组三个索引）
    if (i + 2 < indices.length) {
      filteredIndices.push(indices[i], indices[i + 1], indices[i + 2])
    }
  }

  // 创建新的 BufferGeometry，更新索引数组和顶点数据
  bufferGeometry.setIndex(filteredIndices)
  bufferGeometry.setAttribute('position', bufferGeometry.getAttribute('position'))

  // 计算所有三角形面的质心
  const centroids = getCentroidsForTriangles(bufferGeometry)
  return centroids
}

// 使用示例：传入一个 bufferGeometry

/*
float average(const in vec3 color) { return dot(color, vec3(0.3333)); }
差向量
点积

从 THREE r77开始，WebGLRenderTarget 或 WebGLCubeRenderTarget 实例不再被用作uniforms。
必须使用它们的texture 属性  内置attributes和uniforms与代码一起传递到shaders  请给出示例


varying vec2 vUv; // 二维向量,在顶点着色器和片段着色器之间传递纹理坐标信息
	uniform vec4 offsetRepeat;  // 四维向量,控制纹理的偏移量（前两个分量）和重复次数（后两个分量）
  #endif  // 用于结束一个由 #if、#ifdef 或 #ifndef 开始的条件编译块
  #ifdef USE_COLOR    // 判断该特定的标识符是否已经被定义（通过 #define 指令定义过）
  #ifndef USE_MORPHNORMALS  // 判断该标识符没有被定义
*/
