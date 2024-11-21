<template>
  <div id="three-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

export default defineComponent({
  name: 'ThreeScene',
  setup() {
    // 使用ref来创建响应式的Three.js对象引用
    const scene = ref<THREE.Scene>(new THREE.Scene());
    const camera = ref<THREE.PerspectiveCamera>(
      new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
    );
    const renderer = ref<THREE.WebGLRenderer>(new THREE.WebGLRenderer());
    const cube = ref<THREE.Mesh>();
    const plane = ref<THREE.Mesh>();
    const textureIndex = ref(0);
    const textures = ref<THREE.Texture[]>([]);

    const initScene = () => {
      // 设置相机位置
      camera.value.position.z = 5;

      // 设置渲染器属性
      renderer.value.setSize(window.innerWidth, window.innerHeight);
      renderer.value.setPixelRatio(window.devicePixelRatio);
      const container = document.getElementById('three-container');
      if (container) {
        container.appendChild(renderer.value.domElement);
      }

      // 创建正方体几何体
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      // 创建正方体材质并加载纹理
      const cubeMaterial = new THREE.MeshStandardMaterial({
        map: loadTexture('textures/cube.jpg'),
      });
      cube.value = new THREE.Mesh(cubeGeometry, cubeMaterial);
      scene.value.add(cube.value);

      // 创建平面几何体
      const planeGeometry = new THREE.PlaneGeometry(2, 2);
      // 创建平面材质并加载纹理
      const planeMaterial = new THREE.MeshStandardMaterial({
        map: loadTexture('textures/plane.jpg'),
      });
      plane.value = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.value.rotation.x = -Math.PI / 2;
      plane.value.position.y = -1;
      scene.value.add(plane.value);

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.value.add(ambientLight);

      // 添加平行光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.value.add(directionalLight);

      // 加载多个纹理用于切换
      textures.value.push(
        loadTexture('textures/cube_texture_1.jpg'),
        loadTexture('textures/cube_texture_2.jpg')
      );
    };

    const loadTexture = (path: string): THREE.Texture => {
      const texture = new THREE.TextureLoader().load(path);
      return texture;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      cube.value?.rotateX(0.01);
      cube.value?.rotateY(0.01);
      renderer.value.render(scene.value, camera.value);
    };

    // const handleClick = () => {
    //   textureIndex.value = (textureIndex.value + 1) % textures.value.length;
    //   cube.value?.material.map = textures.value[textureIndex.value];
    //   cube.value?.material.needsUpdate = true;
    // };

    onMounted(() => {
      initScene();
    //   animate();
      const container = document.getElementById('three-container');
      if (container) {
        // container.addEventListener('click', handleClick);
      }
    });

    onUnmounted(() => {
      const container = document.getElementById('three-container');
      if (container) {
        // container.removeEventListener('click', handleClick);
      }
      // 更详细的资源清理逻辑可按需添加
    //   cancelAnimationFrame(animate);
    });

    return {
      cube,
      plane,
    };
  },
});
</script>

<style scoped>
#three-container {
  width: 100%;
  height: 600px;
  margin: auto;
}
</style>