<template>
   <div id="three-container">
   </div>
</template>


<script lang='ts' setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { onMounted } from 'vue';
import BAS from "./bas"
import { vertexShader, fragmentShader } from "./bas"
import { Power0, gsap } from 'gsap'

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

// 返回 vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) 等
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


// const setUniformValues = (uniformValues: THREE.Texture, uniforms: { [key: string]: any }) => {
//   uniforms.map.value = uniformValues
//   return uniforms
// }

const createAttribute = (geometry, name, itemSize) => {
  const buffer = new Float32Array( geometry.attributes.position.count * itemSize);
  // const buffer = new Float32Array( geometry.index.count * itemSize);
  const attribute = new THREE.BufferAttribute(buffer, itemSize);
  geometry.setAttribute(name, attribute);
  return attribute;
}

// 计算每个面的质心
const computeCentroid = (indices, positions, i: number) => {
    const index1 = indices[i];
    const index2 = indices[i + 1];
    const index3 = indices[i + 2];
    const vertex1 = [positions[index1 * 3], positions[index1 * 3 + 1], positions[index1 * 3 + 2]];
    const vertex2 = [positions[index2 * 3], positions[index2 * 3 + 1], positions[index2 * 3 + 2]];
    const vertex3 = [positions[index3 * 3], positions[index3 * 3 + 1], positions[index3 * 3 + 2]];

    const vector = new THREE.Vector3(
      vertex1[0] + vertex2[0] + vertex3[0],
      vertex1[1] + vertex2[1] + vertex3[1],
      vertex1[2] + vertex2[2] + vertex3[2]
    ).divideScalar(3)

    return vector
}

// 手动分离每个面的顶点
const separateFaces = (originalGeometry: THREE.BufferGeometry) => {
    const originalPositionAttribute = originalGeometry.attributes.position;
    const originalPositions = originalPositionAttribute.array;
    const originalIndices = originalGeometry.index? originalGeometry.index.array : null;

    const newVertices = [];
    const newIndices = [];
    let currentIndex = 0;

    for (let i = 0; i < originalIndices.length; i += 3) {
      const index1 = originalIndices[i];
      const index2 = originalIndices[i + 1];
      const index3 = originalIndices[i + 2];

      const vertex1 = new THREE.Vector3(
          originalPositions[index1 * 3],
          originalPositions[index1 * 3 + 1],
          originalPositions[index1 * 3 + 2]
      );
      const vertex2 = new THREE.Vector3(
          originalPositions[index2 * 3],
          originalPositions[index2 * 3 + 1],
          originalPositions[index2 * 3 + 2]
      );
      const vertex3 = new THREE.Vector3(
          originalPositions[index3 * 3],
          originalPositions[index3 * 3 + 1],
          originalPositions[index3 * 3 + 2]
      );

      newVertices.push(vertex1);
      newVertices.push(vertex2);
      newVertices.push(vertex3);

      newIndices.push(currentIndex);
      newIndices.push(currentIndex + 1);
      newIndices.push(currentIndex + 2);

      currentIndex += 3;
    }

    const newPositions = new Float32Array(newVertices.length * 3);
    for (let i = 0; i < newVertices.length; i++) {
        const vertex = newVertices[i];
        newPositions[i * 3] = vertex.x;
        newPositions[i * 3 + 1] = vertex.y;
        newPositions[i * 3 + 2] = vertex.z;
    }

    const newPositionAttribute = new THREE.BufferAttribute(newPositions, 3);
    const newIndexAttribute = new THREE.BufferAttribute(new Uint16Array(newIndices), 1);

    // 创建新的BufferGeometry并设置新的属性
    const newBufferGeometry = new THREE.BufferGeometry();
    newBufferGeometry.setAttribute('position', newPositionAttribute);
    newBufferGeometry.setIndex(newIndexAttribute);
    return newBufferGeometry
}

const bufferUVs = (bufferGeometry: THREE.BufferGeometry) => {
    const uvAttribute = bufferGeometry.getAttribute('uv')
    const uvBuffer = uvAttribute.array as Float32Array
    const indexAttribute = bufferGeometry.index;
    const indices = indexAttribute? indexAttribute.array : null;
    const isIndexed =!!indexAttribute;

    if (isIndexed) {
        // 如果是索引方式的几何体
        for (let i = 0; i < indexAttribute.count; i += 3) {
            // 处理每个三角形面（假设索引数据按三角形面顺序排列）
            const indexA = indices[i];
            const indexB = indices[i + 1];
            const indexC = indices[i + 2];

            // 获取纹理坐标数据（基于索引从UV缓冲区获取）
            const uvA = [
                uvBuffer[indexA * 2],
                uvBuffer[indexA * 2 + 1]
            ];
            const uvB = [
                uvBuffer[indexB * 2],
                uvBuffer[indexB * 2 + 1]
            ];
            const uvC = [
                uvBuffer[indexC * 2],
                uvBuffer[indexC * 2 + 1]
            ];

            // 更新纹理坐标数据（这里只是简单示例，可根据实际需求修改更新逻辑）
            uvBuffer[indexA * 2] = uvA[0];
            uvBuffer[indexA * 2 + 1] = uvA[1];
            uvBuffer[indexB * 2] = uvB[0];
            uvBuffer[indexB * 2 + 1] = uvB[1];
            uvBuffer[indexC * 2] = uvC[0];
            uvBuffer[indexC * 2 + 1] = uvC[1];
        }
    } else {
        // 如果是非索引方式的几何体（直接按顺序遍历顶点组成面）
        for (let i = 0; i < uvBuffer.length; i += 2) {
            // 获取当前纹理坐标数据（每2个元素构成一个纹理坐标）
            const uv = [uvBuffer[i], uvBuffer[i + 1]];

            // 更新纹理坐标数据（这里只是简单示例，可根据实际需求修改更新逻辑）
            uvBuffer[i] = uv[0];
            uvBuffer[i + 1] = uv[1];
        }
    }
    const newUvArray = new Float32Array(uvBuffer);
    uvAttribute.needsUpdate = true;
    bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(newUvArray, 2));
  }

// 给 bufferGeometry 添加 shaderMaterial 示例
class Slide extends THREE.Mesh {
  totalDuration: number
  width: number
  height: number
  animationPhase: 'in' | 'out'
  image: any

  constructor(width: number, height: number, animationPhase: 'in' | 'out') {
    const tempGeometry = new THREE.PlaneGeometry(width, height, width * 2, height * 2)

    const geometry = separateFaces(tempGeometry)
    // bufferUVs(geometry)

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

    const startPosition = new THREE.Vector3();
    const control0 = new THREE.Vector3();
    const control1 = new THREE.Vector3();
    const endPosition = new THREE.Vector3();
    const tempPoint = new THREE.Vector3();

    const getControlPoint0 = (centroid: THREE.Vector3): THREE.Vector3 => {
      // 共有 5 种返回值，分别是 1, -1, 0, -0, NaN. 代表的各是正数，负数，正零，负零，NaN
      const signY = Math.sign(centroid.y)
      // 0.1 到 0.3 这个范围取随机数 * 50
      tempPoint.x = THREE.MathUtils.randFloat(0.1, 0.3) * 50
      tempPoint.y = signY * THREE.MathUtils.randFloat(0.1, 0.3) * 70
      // 关于 0 对称的区间内的随机数，范围大小为 20
      tempPoint.z = THREE.MathUtils.randFloatSpread(20)
      return tempPoint
    }

    const getControlPoint1 = (centroid: THREE.Vector3): THREE.Vector3 => {
      const signY = Math.sign(centroid.y)
      tempPoint.x = THREE.MathUtils.randFloat(0.3, 0.6) * 50
      tempPoint.y = -signY * THREE.MathUtils.randFloat(0.3, 0.6) * 70
      tempPoint.z = THREE.MathUtils.randFloatSpread(20)
      return tempPoint
    }


    for (let i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.index.count / 3; i++, i2 += 6, i3 += 9, i4 += 12) {
      const positionAttribute = geometry.getAttribute('position');
      const positions = positionAttribute.array;
      const indices = geometry.index?.array || [];

      const centroid: THREE.Vector3 = computeCentroid(indices, positions, i*3)

      // Animation
      const duration = THREE.MathUtils.randFloat(minDuration, maxDuration)
      const delayX = THREE.MathUtils.mapLinear(
        centroid.x,
        -width * 0.5,
        width * 0.5,
        0.0,
        maxDelayX,
      )
      let delayY: number
      if (animationPhase === 'in') {
        delayY = THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
      } else {
        delayY = THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
      }
      const aAnimationArray = aAnimation.array as Float32Array
      for (let v = 0; v < 6; v += 2) {
        aAnimationArray[i2 + v] = delayX + delayY + Math.random() * stretch * duration
        aAnimationArray[i2 + v + 1] = duration
      }
      // Positions
      endPosition.copy(centroid)
      startPosition.copy(centroid)
      if (animationPhase === 'in') {
        control0.copy(centroid).sub(getControlPoint0(centroid))
        control1.copy(centroid).sub(getControlPoint1(centroid))
      } else {
        // out
        control0.copy(centroid).add(getControlPoint0(centroid))
        control1.copy(centroid).add(getControlPoint1(centroid))
      }
      const aStartPositionArray = aStartPosition.array as Float32Array
      const aControl0Array = aControl0.array as Float32Array
      const aControl1Array = aControl1.array as Float32Array
      const aEndPositionArray = aEndPosition.array as Float32Array
      for (let v = 0; v < 9; v += 3) {
        aStartPositionArray[i3 + v] = startPosition.x
        aStartPositionArray[i3 + v + 1] = startPosition.y
        aStartPositionArray[i3 + v + 2] = startPosition.z
        aControl0Array[i3 + v] = control0.x
        aControl0Array[i3 + v + 1] = control0.y
        aControl0Array[i3 + v + 2] = control0.z
        aControl1Array[i3 + v] = control1.x
        aControl1Array[i3 + v + 1] = control1.y
        aControl1Array[i3 + v + 2] = control1.z
        aEndPositionArray[i3 + v] = endPosition.x
        aEndPositionArray[i3 + v + 1] = endPosition.y
        aEndPositionArray[i3 + v + 2] = endPosition.z
      }
    }


    const basicShader = THREE.ShaderLib['basic'];

    const tempUniforms = THREE.UniformsUtils.merge([basicShader.uniforms, { uTime: { value: 0 }}]);
    const uniformValues = new THREE.Texture()

    tempUniforms.map.value = uniformValues

    // const vertexShader = _concatVertexShader(animationPhase);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      // fragmentShader: fragmentShader,
      lights: false,
      uniforms: tempUniforms,
      defines: {
        USE_MAP: ""
      },
      side: THREE.DoubleSide,
    })

    console.log("geometry")
    console.log(geometry)
    console.log("material")
    console.log(material)

    super(geometry, material)
    this.frustumCulled = false;
    this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;
  }

  setImage(image: HTMLImageElement | HTMLCanvasElement | THREE.Texture): void {
      // 使用箭头函数来确保this始终指向Slide类的实例，避免this指向丢失或错误的情况
      const setImageInternal = (img: HTMLImageElement | HTMLCanvasElement | THREE.Texture) => {
          if (!this.material) {
              console.error('材质未正确初始化，无法设置图片');
              return;
          }
          const shaderMaterial = this.material as THREE.ShaderMaterial;
          if (!shaderMaterial.uniforms.map) {
              console.error('材质的uniforms中不存在map属性，无法设置图片');
              return;
          }
          const mapUniform = shaderMaterial.uniforms.map;
          // 先进行类型判断，确保传入的image类型符合期望，避免后续赋值出现类型错误
          if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement || img instanceof THREE.Texture) {
              mapUniform.value.image = img;
              mapUniform.value.needsUpdate = true;
              console.log("图片已成功设置到材质");
          } else {
              console.error('传入的image参数类型不符合要求，无法设置图片');
          }
      };
      setImageInternal(image);
  }

  get time(): number {
      return (this.material as THREE.ShaderMaterial).uniforms['uTime'].value;
  }

  // 设置时间属性
  set time(v: number) {
      (this.material as THREE.ShaderMaterial).uniforms['uTime'].value = v;
  }

  transition() {
    return gsap
      .fromTo(
        this,
        { time: 0.0 },
        {
          time: this.totalDuration,
          ease: Power0.easeInOut,
        },
      )
      .duration(3.0)
  }
}

const createTweenScrubber = (tween: gsap.core.Timeline, seekSpeed: number = 0.001) => {
  function stop(): void {
    gsap.to(tween, 1, { timeScale: 0 })
  }

  function resume(): void {
    gsap.to(tween, 1, { timeScale: 1 })
  }

  function seek(dx: number): void {
    const progress = tween.progress()
    const p = THREE.MathUtils.clamp(progress + dx * seekSpeed, 0, 1)

    tween.progress(p)
  }

  let _cx = 0

  // desktop
  let mouseDown = false
  document.body.style.cursor = 'pointer'

  window.addEventListener('mousedown', function (e) {
    mouseDown = true
    document.body.style.cursor = 'ew-resize'
    _cx = e.clientX
    stop()
  })
  window.addEventListener('mouseup', function () {
    mouseDown = false
    document.body.style.cursor = 'pointer'
    resume()
  })
  window.addEventListener('mousemove', function (e) {
    if (mouseDown === true) {
      const cx = e.clientX
      const dx = cx - _cx
      _cx = cx

      seek(dx)
    }
  })
  // mobile
  window.addEventListener('touchstart', function (e) {
    _cx = e.touches[0].clientX
    stop()
    e.preventDefault()
  })
  window.addEventListener('touchend', function (e) {
    resume()
    e.preventDefault()
  })
  window.addEventListener('touchmove', function (e) {
    const cx = e.touches[0].clientX
    const dx = cx - _cx
    _cx = cx

    seek(dx)
    e.preventDefault()
  })
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
	l1.load('./images/spring.png',
    function(image) {
      console.log(image)
      slide.setImage(image)
    },
    undefined,
    function (e) {
      console.log("image");
      console.error( 'An error happened.', e );
    }
  )

  root.scene.add(slide)

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, yoyo: true })

  tl.add(slide.transition(), 0)

  createTweenScrubber(tl)
}
</script>


<style lang='scss' scoped>

</style>
