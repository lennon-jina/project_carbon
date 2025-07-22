// 필요한 Three.js 모듈 가져오기
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 새로운 메뉴 코드 - 햄버거 메뉴 관련 코드
let burger = document.getElementById("burger");
let overlay = document.querySelector(".page-wrap section");
let showMenu = false;

overlay.style.display = "none";
burger.addEventListener("click", (e) => {
  showMenu = !showMenu;
  if (showMenu) {
    burger.classList.add("active");
    overlay.style.display = "block";
    gsap.to(overlay, 1, {
      clipPath: "polygon(0% 0%, 100% 0, 100% 100%, 0% 100%)",
      ease: "expo.in"
    });
  } else {
    burger.classList.remove("active");
    gsap.to(overlay, 1, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      ease: "expo.out",
      onComplete: () => (overlay.style.display = "none")
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // 스크롤 애니메이션 설정
  initScrollAnimations();
 
  // 3D 모델 로드 및 렌더링
  init3DScene();
 
  // 버튼 이벤트 리스너
  document.querySelectorAll('.btn-select').forEach(button => {
    button.addEventListener('click', function() {
      const modelType = this.getAttribute('data-model');
      if (modelType === 'electric-car') {
        window.location.href = 'electric-car.html';
      } else if (modelType === 'bicycle') {
        window.location.href = 'bicycle.html';
      }
    });
  });
 
  // 모델 전환 컨트롤 버튼
  document.getElementById('next-btn').addEventListener('click', function() {
    switchModel('next');
  });
 
  document.getElementById('prev-btn').addEventListener('click', function() {
    switchModel('prev');
  });
});

// 스크롤 기반 애니메이션 초기화
function initScrollAnimations() {
  // About 섹션 페이드인
  gsap.from('.about-section .section-title', {
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 30,
    duration: 0.8
  });
 
  gsap.from('.about-text p', {
    scrollTrigger: {
      trigger: '.about-text',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 20,
    duration: 0.8,
    stagger: 0.2
  });
 
  gsap.from('.stat-card', {
    scrollTrigger: {
      trigger: '.stats-container',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2
  });
 
  // 솔루션 섹션 페이드인
  gsap.from('.solutions-section .section-title, .solutions-intro', {
    scrollTrigger: {
      trigger: '.solutions-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2
  });
 
  gsap.from(['.model-showcase', '.model-info-panel'], {
    scrollTrigger: {
      trigger: '.selection-UI',
      start: 'top 70%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 50,
    duration: 1,
    stagger: 0.3
  });
 
  // 모델 정보가 보일 때 스탯 바 애니메이션
  document.querySelectorAll('.model-info').forEach(info => {
    const statBars = info.querySelectorAll('.stat-value');
   
    // 초기에는 모든 스탯 바를 0으로 설정
    gsap.set(statBars, { width: '0%' });
   
    // 모델 정보 패널이 활성화될 때 스탯 바 애니메이션
    info.addEventListener('transitionend', function() {
      if (info.classList.contains('active')) {
        gsap.to(statBars, {
          width: function() {
            // data-width 속성에서 값을 가져오도록 수정
            return this.getAttribute('data-width');
          },
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.1
        });
      }
    });
  });
}

// 3D 씬 초기화 및 모델 로드
function init3DScene() {
  const modelStage = document.getElementById('model-stage');
  if (!modelStage) return;
 
  const scene = new THREE.Scene();
 
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 2, 5);
 
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(400, 400);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  modelStage.appendChild(renderer.domElement);
 
  // 빛 설정
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
 
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
 
  // 스포트라이트 추가
  const spotLight = new THREE.SpotLight(0x4ade80, 1);
  spotLight.position.set(0, 10, 0);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.2;
  spotLight.decay = 2;
  spotLight.distance = 50;
  spotLight.castShadow = true;
  scene.add(spotLight);
 
  // 바닥 플랫폼 추가
  const platformGeometry = new THREE.CircleGeometry(2, 32);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.2
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = -1;
  platform.receiveShadow = true;
  scene.add(platform);
 
  // 모델 로드
  let carModel, bicycleModel;
  let activeModel = 'electric-car'; // 처음에는 전기차가 활성화
 
  // DRACOLoader 설정
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
 
  // GLTF 로더
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
 
  // 전기차 모델 로드
  loader.load(
    'img/car.glb',
    function(gltf) {
      carModel = gltf.scene;
      carModel.scale.set(1, 1, 1);
      carModel.position.set(0, 0, 0);
     
      // 그림자 설정
      carModel.traverse(function(node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
     
      scene.add(carModel);
     
      // 로드 후 모델에 애니메이션 효과 적용
      gsap.from(carModel.position, {
        y: 5,
        duration: 1.5,
        ease: 'bounce.out'
      });
     
      gsap.from(carModel.rotation, {
        y: Math.PI * 2,
        duration: 2,
        ease: 'power2.out'
      });
    },
    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% 전기차 로드 중');
    },
    function(error) {
      console.error('전기차 GLB 모델 로드 오류:', error);
      // 오류 시 대체 형상 생성
      const geometry = new THREE.BoxGeometry(1.5, 0.5, 3);
      const material = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
      carModel = new THREE.Mesh(geometry, material);
      carModel.castShadow = true;
      carModel.receiveShadow = true;
      carModel.position.set(0, 0, 0);
      scene.add(carModel);
    }
  );
 
  // 자전거 모델 로드
  loader.load(
    'img/bicycle.glb',
    function(gltf) {
      bicycleModel = gltf.scene;
      bicycleModel.scale.set(25, 25, 25);
      bicycleModel.position.set(0, -10, 0); // 초기에는 화면 밖에 위치
     
      // 그림자 설정
      bicycleModel.traverse(function(node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
     
      scene.add(bicycleModel);
    },
    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% 자전거 로드 중');
    },
    function(error) {
      console.error('자전거 GLB 모델 로드 오류:', error);
      // 오류 시 대체 형상 생성
      const geometry = new THREE.TorusGeometry(0.7, 0.2, 16, 100);
      const material = new THREE.MeshStandardMaterial({ color: 0x60a5fa });
      bicycleModel = new THREE.Mesh(geometry, material);
      bicycleModel.castShadow = true;
      bicycleModel.receiveShadow = true;
      bicycleModel.position.set(0, -10, 0);
      scene.add(bicycleModel);
    }
  );
 
  // 모델 전환 함수
  window.switchModel = function(direction) {
    const oldModel = activeModel;
   
    // 현재 활성 모델에 따라 다음 모델 결정
    if (direction === 'next') {
      activeModel = activeModel === 'electric-car' ? 'bicycle' : 'electric-car';
    } else {
      activeModel = activeModel === 'electric-car' ? 'bicycle' : 'electric-car';
    }
   
    // UI 업데이트
    document.querySelectorAll('.model-info').forEach(info => {
      info.classList.remove('active');
    });
   
    document.querySelector(`.model-info[data-model="${activeModel}"]`).classList.add('active');
   
    // 현재 모델 애니메이션으로 퇴장
    let currentModel = oldModel === 'electric-car' ? carModel : bicycleModel;
    let nextModel = activeModel === 'electric-car' ? carModel : bicycleModel;
   
    if (currentModel && nextModel) {
      // 현재 모델 퇴장 애니메이션
      gsap.to(currentModel.position, {
        y: direction === 'next' ? -10 : 10,
        duration: 1,
        ease: 'power2.in',
        onComplete: function() {
          // 다음 모델 입장 애니메이션
          nextModel.position.y = direction === 'next' ? 10 : -10;
         
          let targetY = 0; // 기본 최종 Y 위치는 0 (전기차용)
          if (activeModel === 'bicycle') {
            targetY = -0.2; // 원하는 만큼 값을 조정.
          }
          
          gsap.to(nextModel.position, {
            y: targetY,
            duration: 1,
            ease: 'bounce.out'
          });
         
          gsap.to(nextModel.rotation, {
            y: nextModel.rotation.y + Math.PI * 2,
            duration: 2,
            ease: 'power2.out'
          });
        }
      });
    }
  };
 
  // 애니메이션 루프
  function animate() {
    requestAnimationFrame(animate);
   
    // 모델 자동 회전
    if (carModel) {
      carModel.rotation.y += 0.005;
    }
   
    if (bicycleModel) {
      bicycleModel.rotation.y += 0.005;
    }
   
    // 플랫폼 회전
    platform.rotation.z += 0.005;
   
    renderer.render(scene, camera);
  }
 
  animate();
 
  // 창 크기 변경 시 반응형 처리
  window.addEventListener('resize', function() {
    const stageWidth = modelStage.clientWidth;
    const stageHeight = modelStage.clientHeight;
   
    camera.aspect = stageWidth / stageHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stageWidth, stageHeight);
  });
 
  // 화면 전환 시 카메라 위치 업데이트
  const updateCameraPosition = () => {
    if (window.innerWidth <= 768) {
      camera.position.set(0, 2, 6); // 모바일에서는 조금 더 멀리서 보기
    } else {
      camera.position.set(0, 2, 5);
    }
    camera.updateProjectionMatrix();
  };
 
  updateCameraPosition();
  window.addEventListener('resize', updateCameraPosition);
}