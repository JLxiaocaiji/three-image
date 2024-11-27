<template>
  <div id="three-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

// 用于存储THREE.js场景对象
const scene = ref(new THREE.Scene());
// 用于存储相机对象
const camera = ref(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
// 用于存储渲染器对象
const renderer = ref(new THREE.WebGLRenderer());
// 用于存储加载后的图片对应的纹理（初始化为null）
const texture = ref<THREE.Texture | null>(null);

onMounted(() => {
  const imageLoader = new THREE.ImageLoader();
  // 假设图片在项目的public/images目录下，这里使用相对路径（根据实际情况调整）
  imageLoader.load('./images/winter.jpg', (img) => {
    console.log("aaaaa")
    texture.value = new THREE.Texture(img);
    texture.value.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture.value });
    const mesh = new THREE.Mesh(geometry, material);
    scene.value.add(mesh);

    camera.value.position.z = 2;
    renderer.value.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container')?.appendChild(renderer.value.domElement);
    renderer.value.render(scene.value, camera.value);
  });
});
</script>

<style scoped>
#three-container {
  width: 100%;
  height: 100%;
}
</style>
