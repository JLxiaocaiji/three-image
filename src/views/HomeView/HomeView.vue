<template>
   <div id="three-container">
   </div>
</template>


<script lang='ts' setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { onMounted } from 'vue';
import BAS from "./bas"

const utils = {
  // 源对象src中的所有属性复制到目标对象dst
  extend: function <T extends Record<string, any>, U extends Record<string, any>>(
    dst: T,
    src: U,
  ): T & U {
    for (const key in src) {
      // 安全地检查 src 对象是否拥有指定的属性
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        dst[key as keyof T] = src[key] as unknown as T[keyof T]
      }
    }
    return dst as T & U
  },

  // 返回一个随机的符号，1或-1
  randSign: function (): number {
    return Math.random() > 0.5 ? 1 : -1
  },

  // 动画缓动函数
  /**
   * 使用给定的缓动函数ease来计算当前时间t下的位置
   * @param ease 缓动函数
   * @param t 当前时间
   * @param b 初始位置
   * @param c 变化量
   * @param d 总时间
   * @returns 计算后的当前位置
   */
  ease: function (
    ease: { getRatio: (t: number) => number },
    t: number,
    b: number,
    c: number,
    d: number,
  ): number {
    return b + ease.getRatio(t / d) * c
  },
}

interface THREERootParams {
  fov?: number
  zNear?: number
  zFar?: number
  createCameraControls?: boolean
  antialias?: boolean
  deviceInfo: Record<string, any>
}
class THREERoot {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls?: OrbitControls
  deviceInfo: Record<string, any>

  constructor(params: THREERootParams) {
    params = utils.extend(
      {
        fov: 60,
        zNear: 10,
        zFar: 100000,
        createCameraControls: true,
      },
      params,
    )

    this.deviceInfo = params.deviceInfo

    this.renderer = new THREE.WebGLRenderer({
      antialias: params.antialias,
      alpha: true,
      })

    this.renderer.setPixelRatio(Math.min(2, params.deviceInfo.devicePixelRatio || 1))
    document.getElementById('three-container').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      params.fov,
      params.deviceInfo.windowWidth / params.deviceInfo.windowHeight,
      params.zNear,
      params.zFar,
    )

    this.scene = new THREE.Scene()

    // 默认 false
    if (params.createCameraControls) {
      this.controls = new OrbitControls(this.camera, params.deviceInfo.canvas)
    }

    this.resize = this.resize.bind(this)
    this.tick = this.tick.bind(this)

    this.resize()
    this.tick()
    window.addEventListener('resize', this.resize, false)
  }

  tick(): void {
    this.update()
    this.render()
    requestAnimationFrame(this.tick)
  }

  update(): void {
    this.controls?.update()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  resize(): void {
    this.camera.aspect = this.deviceInfo.windowWidth / this.deviceInfo.windowHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.deviceInfo.windowWidth, this.deviceInfo.windowHeight)
  }
}

const deviceInfo = {
   devicePixelRatio: 1,
   windowWidth: 600,
   windowHeight: 500,
}

onMounted(() => {
    show(deviceInfo);
})

const _concatFunctions = () => {
  const shaderFunctions =  [
        BAS.ShaderChunk['cubic_bezier'],
        // BAS.ShaderChunk[(animationPhase === 'in' ? 'ease_out_cubic' : 'ease_in_cubic')],
        BAS.ShaderChunk['ease_in_out_cubic'],
        BAS.ShaderChunk['quaternion_rotation']
      ]
  return shaderFunctions.join('\n');
}

const _concatParameters = () => {
  const shaderParameters =  [
    'uniform float uTime;',
    'attribute vec2 aAnimation;',
    'attribute vec3 aStartPosition;',
    'attribute vec3 aControl0;',
    'attribute vec3 aControl1;',
    'attribute vec3 aEndPosition;',
  ]
  return shaderParameters.join('\n');
}

const _concatVertexInit = () => {
  const shaderVertexInit = [
    'float tDelay = aAnimation.x;',
    'float tDuration = aAnimation.y;',
    'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
    'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
    //'float tProgress = tTime / tDuration;'
  ]

  return shaderVertexInit.join('\n');
}

const _concatTransformNormal = () => {
  const shaderTransformNormal = []
  return shaderTransformNormal.join('\n');
}
const _concatTransformPosition = (animationPhase: string) => {
  const shaderTransformPosition = [
        (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
        'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
      ]
  return shaderTransformPosition.join('\n');
}

const _concatVertexShader = (animationPhase: string) => {
  return [
      THREE.ShaderChunk[ "common" ],
      THREE.ShaderChunk[ "uv_pars_vertex" ],
      THREE.ShaderChunk[ "uv2_pars_vertex" ],
      THREE.ShaderChunk[ "envmap_pars_vertex" ],
      THREE.ShaderChunk[ "color_pars_vertex" ],
      THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
      THREE.ShaderChunk[ "skinning_pars_vertex" ],
      THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],

      _concatFunctions(),

      _concatParameters(),

      "void main() {",

      _concatVertexInit(),

      THREE.ShaderChunk[ "uv_vertex" ],
      THREE.ShaderChunk[ "uv2_vertex" ],
      THREE.ShaderChunk[ "color_vertex" ],
      THREE.ShaderChunk[ "skinbase_vertex" ],

      "	#ifdef USE_ENVMAP",

      THREE.ShaderChunk[ "beginnormal_vertex" ],

      _concatTransformNormal(),

      THREE.ShaderChunk[ "morphnormal_vertex" ],
      THREE.ShaderChunk[ "skinnormal_vertex" ],
      THREE.ShaderChunk[ "defaultnormal_vertex" ],

      "	#endif",

      THREE.ShaderChunk[ "begin_vertex" ],

      _concatTransformPosition(animationPhase),

      THREE.ShaderChunk[ "morphtarget_vertex" ],
      THREE.ShaderChunk[ "skinning_vertex" ],
      THREE.ShaderChunk[ "project_vertex" ],
      THREE.ShaderChunk[ "logdepthbuf_vertex" ],

      THREE.ShaderChunk[ "worldpos_vertex" ],
      THREE.ShaderChunk[ "envmap_vertex" ],

      "}"
  ].join( "\n" );
}


const setUniformValues = (uniformValues: THREE.Texture, uniforms: { [key: string]: any }) => {
  uniforms.map.value = uniformValues
  return uniforms
}

const createAttribute = (geometry, name, itemSize) => {
  // const buffer = new Float32Array( geometry.attributes.position.count * 3 * itemSize);
  const buffer = new Float32Array( geometry.attributes.position.count * itemSize);
  const attribute = new THREE.BufferAttribute(buffer, itemSize);
  geometry.setAttribute(name, attribute);
  return attribute;
}

// 计算每个面的质心
const computeCentroid = () => {

  for (let i = 0; i < indices.length; i += 3) {
    const index1 = indices[i];
      const index2 = indices[i + 1];
      const index3 = indices[i + 2];
      const vertex1 = [vertices[index1 * 3], vertices[index1 * 3 + 1], vertices[index1 * 3 + 2]];
      const vertex2 = [vertices[index2 * 3], vertices[index2 * 3 + 1], vertices[index2 * 3 + 2]];
      const vertex3 = [vertices[index3 * 3], vertices[index3 * 3 + 1], vertices[index3 * 3 + 2]];
      const centroidX = (vertex1[0] + vertex2[0] + vertex3[0]) / 3;
      const centroidY = (vertex1[1] + vertex2[1] + vertex3[1]) / 3;
      const centroidZ = (vertex1[2] + vertex2[2] + vertex3[2]) / 3;

      const vector = new THREE.Vector3(
        vertex1[0] + vertex2[0] + vertex3[0],
        vertex1[1] + vertex2[1] + vertex3[1],
        vertex1[2] + vertex2[2] + vertex3[2]
      ).divideScalar(3)
  }
}

// 给 bufferGeometry 添加 shaderMaterial 示例
class Slide extends THREE.Mesh {
  totalDuration: number

  constructor(width: number, height: number, animationPhase: 'in' | 'out') {
    const geometry = new THREE.PlaneGeometry(width, height, width * 2, height * 2)

    // geometry.bufferUVs();

    console.log(geometry)

    const aAnimation = createAttribute(geometry, 'aAnimation', 2);
    const aStartPosition = createAttribute(geometry, 'aStartPosition', 3);
    const aControl0 = createAttribute(geometry, 'aControl0', 3);
    const aControl1 = createAttribute(geometry, 'aControl1', 3);
    const aEndPosition = createAttribute(geometry, 'aEndPosition', 3);

    const minDuration = 0.8;
    const maxDuration = 1.2;
    const maxDelayX = 0.9;
    const maxDelayY = 0.125;
    const stretch = 0.11;

    const totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

    const startPosition = new THREE.Vector3();
    const control0 = new THREE.Vector3();
    const control1 = new THREE.Vector3();
    const endPosition = new THREE.Vector3();
    const tempPoint = new THREE.Vector3();

    for (let i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.index.count / 3; i++, i2 += 6, i3 += 9, i4 += 12) {
    }





    const basicShader = THREE.ShaderLib['basic'];

    const tempUniforms = THREE.UniformsUtils.merge([basicShader.uniforms, { uTime: { value: 0 }}]);
    const uniformValues = new THREE.Texture()

    const uniforms = setUniformValues(uniformValues, tempUniforms)

    // if (uniformValues.map) {
    //   this.defines['USE_MAP'] = ''
    // }

    const vertexShader = _concatVertexShader(animationPhase);
    const fragmentShader = basicShader.fragmentShader

    console.log("vertexShader")
    console.log(vertexShader)
    console.log("fragmentShader")
    console.log(fragmentShader)

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      lights: false,
      uniforms: uniforms,
      defines: {
        "USE_MAP": ""
      }
    })
    super(geometry, material)
    this.frustumCulled = false;
  }

  setImage(image: HTMLImageElement | HTMLCanvasElement | THREE.Texture) {
    (this.material as THREE.ShaderMaterial).uniforms.map.value.image = image;
    (this.material as THREE.ShaderMaterial).uniforms.map.value.needsUpdate = true;
  }
}

const show = (deviceInfo: Record<string, any>) => {
   const root = new THREERoot({
    createCameraControls: !true,
    antialias: deviceInfo.devicePixelRatio === 1,
    fov: 80,
    deviceInfo: deviceInfo,
  })

  root.renderer.setClearColor(0x000000);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 60);


  const width = 100, height = 60
  const slide = new Slide(width, height, "out")


  const l1 = new THREE.ImageLoader();
	l1.setCrossOrigin('Anonymous');
	l1.load('./images/winter.jpg', function(img) {
    console.log("image");
    console.log(img)
	  slide.setImage(img);
	})

  root.scene.add(slide)
}
</script>


<style lang='scss' scoped>

</style>
