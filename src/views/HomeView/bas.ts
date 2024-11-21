import * as THREE from 'three'

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

BAS.Utils = {
  // 传入数据 THREE.Geometry 类型, 目的：获取并分离 顶点数据
  separateFaces: function (bufferGeometry: THREE.BufferGeometry) {
    // 获取顶点位置属性，这是一个 BufferAttribute 类型的对象，它包含了所有顶点的位置数据（以扁平数组形式存储，每个顶点有三个分量对应 x、y、z 坐标）
    // attribute 中 position 的值
    const positionAttribute = bufferGeometry.getAttribute('position')
    // 索引属性，如果几何对象使用了索引来复用顶点（可以节省内存并提高渲染效率），那么这个属性就是一个 BufferAttribute 类型对象存储着索引数据，若没有使用索引则为 null
    const indexAttribute = bufferGeometry.getIndex()
    // 面的数量, 每三个顶点构成一个面
    const faceCount = bufferGeometry.getAttribute('position').count / 3
    // 创建一个新的 Float32Array 类型的数组，用于存储分离后面的顶点位置数据，大小根据面的数量乘以每个面的顶点数（3 个顶点）再乘以每个顶点的坐标分量数（3 个分量 x、y、z）
    const newPositionArray = new Float32Array(faceCount * 3 * 3)
    // 如果存在索引属性（indexAttribute 不为 null），则创建一个新的 Uint16Array 类型的数组用于存储新的索引数据，其大小根据面的数量乘以每个面的顶点数（3 个）来确定；若不存在索引则将其设置为 null
    const newIndexArray = indexAttribute ? new Uint16Array(faceCount * 3) : null

    // 跟踪在新的位置数组 写入数据的偏移量
    let newPositionOffset = 0
    // 跟踪在新的索引数组 写入数据的偏移量
    let newIndexOffset = 0

    for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
      // 根据当前面的索引计算出在原始顶点位置数组和索引数组（如果有）中的基础索引位置，因为每个面由三个顶点组成，所以乘以 3
      const baseIndex = faceIndex * 3

      // 获取当前面在原始位置数组中的索引
      const indexA = indexAttribute ? indexAttribute.getX(baseIndex) : baseIndex
      const indexB = indexAttribute ? indexAttribute.getX(baseIndex + 1) : baseIndex + 1
      const indexC = indexAttribute ? indexAttribute.getX(baseIndex + 2) : baseIndex + 2

      // 获取当前面的三个顶点坐标
      const vertexA = [
        positionAttribute.getX(indexA * 3),
        positionAttribute.getY(indexA * 3),
        positionAttribute.getZ(indexA * 3),
      ]
      const vertexB = [
        positionAttribute.getX(indexB * 3),
        positionAttribute.getY(indexB * 3),
        positionAttribute.getZ(indexB * 3),
      ]
      const vertexC = [
        positionAttribute.getX(indexC * 3),
        positionAttribute.getY(indexC * 3),
        positionAttribute.getZ(indexC * 3),
      ]

      // 将当前面第一个顶点的坐标分量依次存入新的位置数组
      newPositionArray[newPositionOffset++] = vertexA[0]
      newPositionArray[newPositionOffset++] = vertexA[1]
      newPositionArray[newPositionOffset++] = vertexA[2]
      // 将当前面第二个顶点的坐标分量依次存入新的位置数组
      newPositionArray[newPositionOffset++] = vertexB[0]
      newPositionArray[newPositionOffset++] = vertexB[1]
      newPositionArray[newPositionOffset++] = vertexB[2]
      // 将当前面第三个顶点的坐标分量依次存入新的位置数组
      newPositionArray[newPositionOffset++] = vertexC[0]
      newPositionArray[newPositionOffset++] = vertexC[1]
      newPositionArray[newPositionOffset++] = vertexC[2]

      if (indexAttribute) {
        // 更新新的索引数组（如果存在索引属性），指向新位置数组中对应顶点的位置
        ;(newIndexArray as Uint16Array)[newIndexOffset++] = newPositionOffset - 9
        ;(newIndexArray as Uint16Array)[newIndexOffset++] = newPositionOffset - 6
        ;(newIndexArray as Uint16Array)[newIndexOffset++] = newPositionOffset - 3
      }
    }

    // 更新BufferGeometry的顶点位置属性，用新的位置数组创建新的BufferAttribute并设置进去
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(newPositionArray, 3))

    if (indexAttribute) {
      // 如果存在索引属性，更新BufferGeometry的索引属性，用新的索引数组创建新的BufferAttribute并设置进去
      bufferGeometry.setIndex(new THREE.BufferAttribute(newIndexArray as Uint16Array, 1))
    }
  },
}

export class ModelBufferGeometry extends THREE.BufferGeometry {
  modelGeometry: THREE.BufferGeometry
  //   faceCount: number
  //   vertexCount: number

  constructor(model: THREE.BufferGeometry) {
    super(model)
    // 确认传入的是BufferGeometry类型后进行如下操作
    this.modelGeometry = model
    // 通过顶点位置属性的count属性计算面的数量，假设每3个顶点组成一个面
    // this.faceCount = model.getAttribute('position').count / 3
    // this.vertexCount = model.getAttribute('position').count

    // const indexAttribute = model.getIndex()
    // if (indexAttribute) {
    //   this.setIndex(indexAttribute)
    // } else {
    //   // 若不存在索引属性，可根据需求处理，比如创建默认索引等
    //   console.warn('传入的BufferGeometry缺少索引属性，可能影响渲染效果')
    //   // 以下是简单创建顺序索引的示例，实际可能需更复杂处理
    //   const positionCount = model.getAttribute('position').count
    //   const defaultIndexArray = new Uint16Array(positionCount)
    //   for (let i = 0; i < positionCount; i++) {
    //     defaultIndexArray[i] = i
    //   }
    //   this.setIndex(new THREE.BufferAttribute(defaultIndexArray, 1))
    // }
  }

  createAttribute(name: string, itemSize: number) {
    const positionAttribute = this.modelGeometry.getAttribute('position')
    // 如果没能获取到位置属性（意味着传入的 BufferGeometry 数据可能不完整或者不符合预期），则输出警告信息提示缺少位置属性，无法准确创建其他属性，并返回 null
    if (!positionAttribute) {
      console.warn('传入的BufferGeometry缺少位置属性，无法准确创建其他属性')
      return null
    }
    // 获取顶点位置属性的 count 值作为顶点数量，用于确定要创建的属性数据数组的大小
    const vertexCount = positionAttribute.count
    // 基于获取到的顶点数量和传入的每个元素的分量数（itemSize）创建一个新的 Float32Array 类型的数组，这个数组将用于存储具体的属性数据（比如纹理坐标、法线等其他几何属性的数据）
    const buffer = new Float32Array(vertexCount * itemSize)
    // 将创建好的数组 buffer 包装成 BufferAttribute 对象，指定每个元素的分量数为 itemSize，使其符合 BufferGeometry 中属性数据的存储格式要求
    const attribute = new THREE.BufferAttribute(buffer, itemSize)

    if (!this.modelGeometry.getAttribute(name)) {
      // 如果传入的BufferGeometry已经有同名属性，先移除它
      this.modelGeometry.setAttribute(
        name,
        // new THREE.BufferAttribute(new Float32Array(0), itemSize),
        attribute,
      )
    }
    this.modelGeometry.setAttribute(name, attribute)

    return attribute
  }
}

/**
BAS.BaseAnimationMaterial = function (parameters: THREE.ShaderMaterialParameters = {}) {
  THREE.ShaderMaterial.call(this)

  this.shaderFunctions = []
  this.shaderParameters = []
  this.shaderVertexInit = []
  this.shaderTransformNormal = []
  this.shaderTransformPosition = []

  this.setValues(parameters)
}
BAS.BaseAnimationMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype)
BAS.BaseAnimationMaterial.prototype.constructor = BAS.BaseAnimationMaterial

// abstract
BAS.BaseAnimationMaterial.prototype._concatVertexShader = function () {
  return ''
}

BAS.BaseAnimationMaterial.prototype._concatFunctions = function () {
  return this.shaderFunctions.join('\n')
}
BAS.BaseAnimationMaterial.prototype._concatParameters = function () {
  return this.shaderParameters.join('\n')
}
BAS.BaseAnimationMaterial.prototype._concatVertexInit = function () {
  return this.shaderVertexInit.join('\n')
}
BAS.BaseAnimationMaterial.prototype._concatTransformNormal = function () {
  return this.shaderTransformNormal.join('\n')
}
BAS.BaseAnimationMaterial.prototype._concatTransformPosition = function () {
  return this.shaderTransformPosition.join('\n')
}

BAS.BaseAnimationMaterial.prototype.setUniformValues = function (values: Record<string, any>) {
  for (const key in values) {
    if (key in this.uniforms) {
      const uniform = this.uniforms[key]
      const value = values[key]

      // todo add matrix uniform types
      switch (uniform.type) {
        case 'c': // color
          uniform.value.set(value)
          break
        case 'v2': // vectors
        case 'v3':
        case 'v4':
          uniform.value.copy(value)
          break
        case 'f': // float
        case 't': // texture
        default:
          uniform.value = value
      }
    }
  }
}
*/

export class BaseAnimationMaterial extends THREE.ShaderMaterial {
  // 存储着色器函数代码片段的数组
  shaderFunctions: string[]
  // 存储着色器参数代码片段的数组
  shaderParameters: string[]
  // 存储顶点初始化相关着色器代码片段的数组
  shaderVertexInit: string[]
  // 存储法线变换相关着色器代码片段的数组
  shaderTransformNormal: string[]
  // 存储位置变换相关着色器代码片段的数组
  shaderTransformPosition: string[]

  constructor(parameters: THREE.ShaderMaterialParameters = {}) {
    super()

    // 初始化各个着色器代码片段数组
    this.shaderFunctions = []
    this.shaderParameters = []
    this.shaderVertexInit = []
    this.shaderTransformNormal = []
    this.shaderTransformPosition = []

    // 使用传入的参数设置材质的初始值
    this.setValues(parameters)
  }

  // 抽象方法，用于拼接顶点着色器代码，目前返回空字符串，子类需要重写来实现具体逻辑
  protected _concatVertexShader(): string {
    return ''
  }

  _concatFunctions(): string {
    return this.shaderFunctions.join('\n')
  }

  _concatParameters(): string {
    return this.shaderParameters.join('\n')
  }

  _concatVertexInit(): string {
    return this.shaderVertexInit.join('\n')
  }

  _concatTransformNormal(): string {
    return this.shaderTransformNormal.join('\n')
  }

  _concatTransformPosition(): string {
    return this.shaderTransformPosition.join('\n')
  }
  setUniformValues(values: Record<string, any>) {
    for (const key in values) {
      if (key in this.uniforms) {
        const uniform = this.uniforms[key]
        const value = values[key]

        // 根据uniform的类型来设置对应的值，目前todo部分提示需要添加矩阵类型的处理逻辑
        switch (uniform.type) {
          case 'c': // 颜色类型
            // if (THREE.Color.isColor(value)) {
            //   uniform.value.set(value)
            // } else {
            //   console.warn(`期望传入颜色类型的值给uniform ${key}，实际传入类型不符`)
            // }
            break
          case 'v2': // 二维向量类型
          case 'v3': // 三维向量类型
          case 'v4': // 四维向量类型
            if (
              value instanceof THREE.Vector2 ||
              value instanceof THREE.Vector3 ||
              value instanceof THREE.Vector4
            ) {
              uniform.value.copy(value)
            } else {
              console.warn(`期望传入向量类型的值给uniform ${key}，实际传入类型不符`)
            }
            break
          case 'f': // 浮点类型
          case 't': // 纹理类型
          default:
            uniform.value = value
        }
      }
    }
  }
}

/*
BAS.BasicAnimationMaterial = function (
  parameters: THREE.ShaderMaterialParameters,
  uniformValues: { [key: string]: any },
) {
  BAS.BaseAnimationMaterial.call(this, parameters)

  const basicShader = THREE.ShaderLib['basic']

  this.uniforms = THREE.UniformsUtils.merge([basicShader.uniforms, this.uniforms])
  this.lights = false
  this.vertexShader = this._concatVertexShader()
  this.fragmentShader = basicShader.fragmentShader

  // todo add missing default defines
  // uniformValues.map && (this.defines['USE_MAP'] = '')
  // uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '')

  if (!this.defines) {
    this.defines = {}
  }
  if (uniformValues.map) {
    this.defines['USE_MAP'] = ''
  }
  if (uniformValues.normalMap) {
    this.defines['USE_NORMALMAP'] = ''
  }
  this.setUniformValues(uniformValues)
}
BAS.BasicAnimationMaterial.prototype = Object.create(BAS.BaseAnimationMaterial.prototype)
BAS.BasicAnimationMaterial.prototype.constructor = BAS.BasicAnimationMaterial

BAS.BasicAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.phong
  return [
    THREE.ShaderChunk['common'],
    THREE.ShaderChunk['uv_pars_vertex'],
    THREE.ShaderChunk['uv2_pars_vertex'],
    THREE.ShaderChunk['envmap_pars_vertex'],
    THREE.ShaderChunk['color_pars_vertex'],
    THREE.ShaderChunk['morphtarget_pars_vertex'],
    THREE.ShaderChunk['skinning_pars_vertex'],
    THREE.ShaderChunk['logdepthbuf_pars_vertex'],

    this._concatFunctions(),

    this._concatParameters(),

    'void main() {',

    this._concatVertexInit(),

    THREE.ShaderChunk['uv_vertex'],
    THREE.ShaderChunk['uv2_vertex'],
    THREE.ShaderChunk['color_vertex'],
    THREE.ShaderChunk['skinbase_vertex'],

    '	#ifdef USE_ENVMAP',

    THREE.ShaderChunk['beginnormal_vertex'],

    this._concatTransformNormal(),

    THREE.ShaderChunk['morphnormal_vertex'],
    THREE.ShaderChunk['skinnormal_vertex'],
    THREE.ShaderChunk['defaultnormal_vertex'],

    '	#endif',

    THREE.ShaderChunk['begin_vertex'],

    this._concatTransformPosition(),

    THREE.ShaderChunk['morphtarget_vertex'],
    THREE.ShaderChunk['skinning_vertex'],
    THREE.ShaderChunk['project_vertex'],
    THREE.ShaderChunk['logdepthbuf_vertex'],

    THREE.ShaderChunk['worldpos_vertex'],
    THREE.ShaderChunk['envmap_vertex'],

    '}',
  ].join('\n')
}
*/

export class BasicAnimationMaterial extends BaseAnimationMaterial {
  uniforms: Record<string, any>
  defines: { [key: string]: string } = {}

  constructor(parameters: THREE.ShaderMaterialParameters, uniformValues: { [key: string]: any }) {
    super(parameters)
    const basicShader = THREE.ShaderLib['basic']
    // 使用THREE.UniformsUtils.merge合并uniforms，确保类型正确
    this.uniforms = THREE.UniformsUtils.merge([basicShader.uniforms, this.uniforms])
    this.lights = false
    // 设置顶点着色器和片段着色器
    this.vertexShader = this._concatVertexShader()
    this.fragmentShader = basicShader.fragmentShader

    // 根据uniformValues来设置defines中的相关标识
    if (uniformValues.map) {
      this.defines['USE_MAP'] = ''
    }
    if (uniformValues.normalMap) {
      this.defines['USE_NORMALMAP'] = ''
    }

    this.setUniformValues(uniformValues)
  }

  _concatVertexShader(): string {
    return [
      THREE.ShaderChunk['common'],
      THREE.ShaderChunk['uv_pars_vertex'],
      THREE.ShaderChunk['uv2_pars_vertex'],
      THREE.ShaderChunk['envmap_pars_vertex'],
      THREE.ShaderChunk['color_pars_vertex'],
      THREE.ShaderChunk['morphtarget_pars_vertex'],
      THREE.ShaderChunk['skinning_pars_vertex'],
      THREE.ShaderChunk['logdepthbuf_pars_vertex'],

      this._concatFunctions(),

      this._concatParameters(),

      'void main() {',

      this._concatVertexInit(),

      THREE.ShaderChunk['uv_vertex'],
      THREE.ShaderChunk['uv2_vertex'],
      THREE.ShaderChunk['color_vertex'],
      THREE.ShaderChunk['skinbase_vertex'],

      '	#ifdef USE_ENVMAP',

      THREE.ShaderChunk['beginnormal_vertex'],

      this._concatTransformNormal(),

      THREE.ShaderChunk['morphnormal_vertex'],
      THREE.ShaderChunk['skinnormal_vertex'],
      THREE.ShaderChunk['defaultnormal_vertex'],

      '	#endif',

      THREE.ShaderChunk['begin_vertex'],

      this._concatTransformPosition(),

      THREE.ShaderChunk['morphtarget_vertex'],
      THREE.ShaderChunk['skinning_vertex'],
      THREE.ShaderChunk['project_vertex'],
      THREE.ShaderChunk['logdepthbuf_vertex'],

      THREE.ShaderChunk['worldpos_vertex'],
      THREE.ShaderChunk['envmap_vertex'],

      '}',
    ].join('\n')
  }
}

/*
BAS.PhongAnimationMaterial = function (
  parameters: THREE.MeshPhongMaterialParameters,
  uniformValues: { [key: string]: any },
) {
  BAS.BaseAnimationMaterial.call(this, parameters)

  const phongShader = THREE.ShaderLib['phong']

  this.uniforms = THREE.UniformsUtils.merge([phongShader.uniforms, this.uniforms])
  this.lights = true
  this.vertexShader = this._concatVertexShader()
  this.fragmentShader = phongShader.fragmentShader

  // todo add missing default defines
  //   uniformValues.map && (this.defines['USE_MAP'] = '')
  //   uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '')

  if (!this.defines) {
    this.defines = {}
  }
  if (uniformValues.map) {
    this.defines['USE_MAP'] = ''
  }
  if (uniformValues.normalMap) {
    this.defines['USE_NORMALMAP'] = ''
  }

  this.setUniformValues(uniformValues)
}
BAS.PhongAnimationMaterial.prototype = Object.create(BAS.BaseAnimationMaterial.prototype)
BAS.PhongAnimationMaterial.prototype.constructor = BAS.PhongAnimationMaterial

BAS.PhongAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.phong
  return [
    '#define PHONG',

    'varying vec3 vViewPosition;',

    '#ifndef FLAT_SHADED',

    '	varying vec3 vNormal;',

    '#endif',

    THREE.ShaderChunk['common'],
    THREE.ShaderChunk['uv_pars_vertex'],
    THREE.ShaderChunk['uv2_pars_vertex'],
    THREE.ShaderChunk['displacementmap_pars_vertex'],
    THREE.ShaderChunk['envmap_pars_vertex'],
    THREE.ShaderChunk['lights_phong_pars_vertex'],
    THREE.ShaderChunk['color_pars_vertex'],
    THREE.ShaderChunk['morphtarget_pars_vertex'],
    THREE.ShaderChunk['skinning_pars_vertex'],
    THREE.ShaderChunk['shadowmap_pars_vertex'],
    THREE.ShaderChunk['logdepthbuf_pars_vertex'],

    this._concatFunctions(),

    this._concatParameters(),

    'void main() {',

    this._concatVertexInit(),

    THREE.ShaderChunk['uv_vertex'],
    THREE.ShaderChunk['uv2_vertex'],
    THREE.ShaderChunk['color_vertex'],
    THREE.ShaderChunk['beginnormal_vertex'],

    this._concatTransformNormal(),

    THREE.ShaderChunk['morphnormal_vertex'],
    THREE.ShaderChunk['skinbase_vertex'],
    THREE.ShaderChunk['skinnormal_vertex'],
    THREE.ShaderChunk['defaultnormal_vertex'],

    '#ifndef FLAT_SHADED', // Normal computed with derivatives when FLAT_SHADED

    '	vNormal = normalize( transformedNormal );',

    '#endif',

    THREE.ShaderChunk['begin_vertex'],

    this._concatTransformPosition(),

    THREE.ShaderChunk['displacementmap_vertex'],
    THREE.ShaderChunk['morphtarget_vertex'],
    THREE.ShaderChunk['skinning_vertex'],
    THREE.ShaderChunk['project_vertex'],
    THREE.ShaderChunk['logdepthbuf_vertex'],

    '	vViewPosition = - mvPosition.xyz;',

    THREE.ShaderChunk['worldpos_vertex'],
    THREE.ShaderChunk['envmap_vertex'],
    THREE.ShaderChunk['lights_phong_vertex'],
    THREE.ShaderChunk['shadowmap_vertex'],

    '}',
  ].join('\n')
}
*/

export class PhongAnimationMaterial extends BaseAnimationMaterial {
  // 明确声明uniforms和defines的类型
  uniforms: Record<string, any>
  defines: { [key: string]: string } = {}

  constructor(parameters: THREE.MeshPhongMaterialParameters, uniformValues: AnyKeyValueObject) {
    super(parameters)

    const phongShader = THREE.ShaderLib['phong']

    // 合并uniforms，确保类型正确
    this.uniforms = THREE.UniformsUtils.merge([phongShader.uniforms, this.uniforms])
    this.lights = true

    // 设置顶点着色器和片段着色器
    this.vertexShader = this._concatVertexShader()
    this.fragmentShader = phongShader.fragmentShader

    // 根据uniformValues来设置defines中的相关标识
    if (uniformValues.map) {
      this.defines['USE_MAP'] = ''
    }
    if (uniformValues.normalMap) {
      this.defines['USE_NORMALMAP'] = ''
    }

    this.setUniformValues(uniformValues)
  }

  _concatVertexShader(): string {
    return [
      '#define PHONG',

      'varying vec3 vViewPosition;',

      '#ifndef FLAT_SHADED',

      '	varying vec3 vNormal;',

      '#endif',

      THREE.ShaderChunk['common'],
      THREE.ShaderChunk['uv_pars_vertex'],
      THREE.ShaderChunk['uv2_pars_vertex'],
      THREE.ShaderChunk['displacementmap_pars_vertex'],
      THREE.ShaderChunk['envmap_pars_vertex'],
      THREE.ShaderChunk['lights_phong_pars_vertex'],
      THREE.ShaderChunk['color_pars_vertex'],
      THREE.ShaderChunk['morphtarget_pars_vertex'],
      THREE.ShaderChunk['skinning_pars_vertex'],
      THREE.ShaderChunk['shadowmap_pars_vertex'],
      THREE.ShaderChunk['logdepthbuf_pars_vertex'],

      this._concatFunctions(),

      this._concatParameters(),

      'void main() {',

      this._concatVertexInit(),

      THREE.ShaderChunk['uv_vertex'],
      THREE.ShaderChunk['uv2_vertex'],
      THREE.ShaderChunk['color_vertex'],
      THREE.ShaderChunk['beginnormal_vertex'],

      this._concatTransformNormal(),

      THREE.ShaderChunk['morphnormal_vertex'],
      THREE.ShaderChunk['skinbase_vertex'],
      THREE.ShaderChunk['skinnormal_vertex'],
      THREE.ShaderChunk['defaultnormal_vertex'],

      '#ifndef FLAT_SHADED', // Normal computed with derivatives when FLAT_SHADED

      '	vNormal = normalize( transformedNormal );',

      '#endif',

      THREE.ShaderChunk['begin_vertex'],

      this._concatTransformPosition(),

      THREE.ShaderChunk['displacementmap_vertex'],
      THREE.ShaderChunk['morphtarget_vertex'],
      THREE.ShaderChunk['skinning_vertex'],
      THREE.ShaderChunk['project_vertex'],
      THREE.ShaderChunk['logdepthbuf_vertex'],

      '	vViewPosition = - mvPosition.xyz;',

      THREE.ShaderChunk['worldpos_vertex'],
      THREE.ShaderChunk['envmap_vertex'],
      THREE.ShaderChunk['lights_phong_vertex'],
      THREE.ShaderChunk['shadowmap_vertex'],

      '}',
    ].join('\n')
  }
}

export class SlideGeometry extends ModelBufferGeometry {
  constructor(model: THREE.BufferGeometry) {
    super(model)
  }
}

export default BAS
