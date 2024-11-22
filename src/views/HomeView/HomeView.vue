<template>
   <div id="three-container">
   </div>
</template>


<script lang='ts' setup>
import { onMounted } from 'vue';
import { Power0, gsap } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import BAS from "./bas"
import { BasicAnimationMaterial, SlideGeometry } from './bas'
import * as THREE from 'three';

onMounted(() => {
    show(deviceInfo);
})

const deviceInfo = {
   devicePixelRatio: 1,
   windowWidth: 600,
   windowHeight: 500,
}

const show = (deviceInfo: Record<string, any>) => {
   const root = new THREERoot({
    createCameraControls: !true,
    antialias: deviceInfo.devicePixelRatio === 1,
    fov: 80,
    deviceInfo: deviceInfo,
  })

  root.renderer.setClearColor(0x000000, 0);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 60);

  const width = 100, height = 60

  const slide = new Slide(width, height, "out")
  const l1 = new THREE.ImageLoader();
	l1.setCrossOrigin('Anonymous');
	l1.load('../images/winter.jpg', function(img) {
    console.log("image");
    console.log(img)
	  slide.setImage(img);
	})
  root.scene.add(slide)

  const slide2 = new Slide(width, height, 'in')
  const l2 = new THREE.ImageLoader()
  l2.setCrossOrigin('Anonymous')
  l2.load('../../static/images/winter.jpg', function (img) {
    slide2.setImage(img)
  })

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.0, yoyo: true })

  tl.add(slide.transition(), 0)
  tl.add(slide2.transition(), 0)

  createTweenScrubber(tl)
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


class Slide extends THREE.Mesh {
  totalDuration: number

  constructor(width: number, height: number, animationPhase: 'in' | 'out') {
    const plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2)

    // BAS.Utils.separateFaces(plane)

    const geometry = new SlideGeometry(plane)

    geometry.bufferUVs();

    const aAnimation = geometry.createAttribute('aAnimation', 2);
    const aStartPosition = geometry.createAttribute('aStartPosition', 3);
    const aControl0 = geometry.createAttribute('aControl0', 3);
    const aControl1 = geometry.createAttribute('aControl1', 3);
    const aEndPosition = geometry.createAttribute('aEndPosition', 3);

    const minDuration = 0.8
    const maxDuration = 1.2
    const maxDelayX = 0.9
    const maxDelayY = 0.125
    const stretch = 0.11

    const startPosition = new THREE.Vector3()
    const control0 = new THREE.Vector3()
    const control1 = new THREE.Vector3()
    const endPosition = new THREE.Vector3()

    const tempPoint = new THREE.Vector3()

    const getControlPoint0 = (centroid: THREE.Vector3): THREE.Vector3 => {
      const signY = Math.sign(centroid.y)
      tempPoint.x = THREE.MathUtils.randFloat(0.1, 0.3) * 50
      tempPoint.y = signY * THREE.MathUtils.randFloat(0.1, 0.3) * 70
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

    for (let i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
      // 获取当前面的索引（假设使用索引，如果没有索引可以按顺序获取，这里以有索引为例稍作调整）
      // const indexAttribute = geometry.getIndex();
      // const baseIndex = i * 3;
      // const indexA = indexAttribute? indexAttribute.getX(baseIndex) : baseIndex;
      // const indexB = indexAttribute? indexAttribute.getX(baseIndex + 1) : baseIndex + 1;
      // const indexC = indexAttribute? indexAttribute.getX(baseIndex + 2) : baseIndex + 2;

      // const vertexA = [
      //     geometry.getAttribute('position').getX(indexA * 3),
      //     geometry.getAttribute('position').getY(indexA * 3),
      //     geometry.getAttribute('position').getZ(indexA * 3)
      // ];
      // const vertexB = [
      //     geometry.getAttribute('position').getX(indexB * 3),
      //     geometry.getAttribute('position').getY(indexB * 3),
      //     geometry.getAttribute('position').getZ(indexB * 3)
      // ];
      // const vertexC = [
      //     geometry.getAttribute('position').getX(indexC * 3),
      //     geometry.getAttribute('position').getY(indexC * 3),
      //     geometry.getAttribute('position').getZ(indexC * 3)
      // ];

      // const centroid = new THREE.Vector3();
      // centroid.x = (vertexA[0] + vertexB[0] + vertexC[0]) / 3;
      // centroid.y = (vertexA[1] + vertexB[1] + vertexC[1]) / 3;
      // centroid.z = (vertexA[2] + vertexB[2] + vertexC[2]) / 3;

      const centroid = BAS.Utils.computeCentroid(geometry, i);

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

    // 创建一个自定义材质，用于实现动画效果
    const material = new BasicAnimationMaterial(
      {
        flatShading: THREE.FlatShading,
        side: THREE.DoubleSide,
        uniforms: {
          // uTime: { type: 'f', value: 0 },
          uTime: { value: 0 },
        },
        shaderFunctions: [
          BAS.ShaderChunk['cubic_bezier'],
          BAS.ShaderChunk['ease_in_out_cubic'],
          BAS.ShaderChunk['quaternion_rotation'],
        ],
        shaderParameters: [
          'uniform float uTime;',
          'attribute vec2 aAnimation;',
          'attribute vec3 aStartPosition;',
          'attribute vec3 aControl0;',
          'attribute vec3 aControl1;',
          'attribute vec3 aEndPosition;',
        ],
        shaderVertexInit: [
          'float tDelay = aAnimation.x;',
          'float tDuration = aAnimation.y;',
          'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
          'float tProgress = ease(tTime, 0.0, 1.0, tDuration);',
        ],
        shaderTransformPosition: [
          animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;',
          'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);',
        ],
      },
      {
        map: new THREE.Texture(),
      },
    )

    super(geometry, material)
    this.frustumCulled = false;
  }
  setImage(image: HTMLImageElement | HTMLCanvasElement | THREE.Texture) {
    (this.material as THREE.ShaderMaterial).uniforms.map.value.image = image;
    (this.material as THREE.ShaderMaterial).uniforms.map.value.needsUpdate = true;
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

  // get time(): number {
  //       return (this.material as THREE.ShaderMaterial).uniforms['uTime'].value;
  //   }

  //   // 设置时间属性
  //   set time(v: number) {
  //       (this.material as THREE.ShaderMaterial).uniforms['uTime'].value = v;
  //   }
}

// class SlideGeometry extends ModelBufferGeometry {
//     constructor(model: THREE.BufferGeometry) {
//         super(model);
//     }
// }
// function SlideGeometry(model: THREE.BufferGeometry) {
//   // 通过 ModelBufferGeometry.call(this, model); 语句调用了另一个构造函数 ModelBufferGeometry（这里推测 ModelBufferGeometry 也是一个自定义的构造函数，可能是当前要创建的 SlideGeometry 的父类或者基类相关的构造函数），并且使用 call 方法显式地绑定了当前函数（也就是 SlideGeometry 构造函数）内部的 this 指针，同时传递了接收到的 model 参数。这样做的目的是为了在创建 SlideGeometry 实例时，先执行 ModelBufferGeometry 的初始化逻辑，让 SlideGeometry 继承 ModelBufferGeometry 的属性和行为，实现一种类似类继承中的构造函数链调用，保证父类相关的初始化操作先完成
//   ModelBufferGeometry.call(this, model);
// }
// // SlideGeometry 的实例在查找属性和方法时，如果自身没有定义，就会沿着原型链去 ModelBufferGeometry.prototype 上查找，从而实现了继承 ModelBufferGeometry 的属性和方法的效果，这是基于原型的继承机制在 JavaScript 中的典型应用，使得 SlideGeometry 可以复用 ModelBufferGeometry 中定义的通用逻辑和属性，同时又可以在自身进行扩展和定制
// SlideGeometry.prototype = Object.create(ModelBufferGeometry.prototype);
// // 在前面通过 Object.create 修改了 SlideGeometry.prototype 的原型指向后，其原有的 constructor 属性（原本指向 SlideGeometry 自身）丢失了，现在将 constructor 属性重新赋值为 SlideGeometry，保证了通过实例的 constructor 属性能够正确地获取到对应的构造函数
// SlideGeometry.prototype.constructor = SlideGeometry;
</script>


<style lang='scss' scoped>

</style>
