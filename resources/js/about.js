// 필요한 Three.js 모듈 가져오기
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 페이지 로드 이벤트
document.addEventListener('DOMContentLoaded', () => {
    // 전역 변수
    let isTransitioning = false;
    let carControls, bicycleControls;
    let dragStartX = 0;
    let currentActiveModel = 'car'; // 시작시 자동차 모델이 앞쪽에 위치
    
    // 터치/마우스 이벤트 리스너 설정
    const container = document.querySelector('.model-orbit');
    container.addEventListener('mousedown', onDragStart);
    container.addEventListener('touchstart', onDragStart, { passive: true });
    container.addEventListener('mousemove', onDragMove);
    container.addEventListener('touchmove', onDragMove, { passive: true });
    container.addEventListener('mouseup', onDragEnd);
    container.addEventListener('touchend', onDragEnd);
    
    // 방향 화살표 이벤트 리스너 추가
    const leftArrow = document.querySelector('.arrow.left');
    const rightArrow = document.querySelector('.arrow.right');
    
    if (leftArrow && rightArrow) {
        leftArrow.addEventListener('click', () => {
            if (currentActiveModel === 'bicycle') {
                switchModels('car');
            }
        });
        
        rightArrow.addEventListener('click', () => {
            if (currentActiveModel === 'car') {
                switchModels('bicycle');
            }
        });
    }
    
    // 3D 모델 설정
    setupModels();
    
    // 모델 설정 함수
    function setupModels() {
        // 자동차 모델 설정
        setupModel('car-model', 'img/car.glb', true);
        
        // 자전거 모델 설정
        setupModel('bicycle-model', 'img/bicycle.glb', false);
    }
    
    // 개별 모델 설정 함수
    function setupModel(containerId, modelPath, isActive) {
        const container = document.getElementById(containerId);
        
        // 씬, 카메라, 렌더러 설정
        const scene = new THREE.Scene();
        
        // 카메라 설정 - 더 낮게 조정
        const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
        // 카메라 각도를 더 낮게 조정 - y값을 3에서 2로 낮춤, z값을 조정하여 더 뒤에서 보는 느낌으로
        camera.position.set(2, 2, 8); 
        camera.lookAt(0, -1, 0); // 더 아래를 바라보도록 설정
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0); // 투명 배경
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);
        
        // 조명 설정 - 더 입체적인 느낌을 위해 조명 강화
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
        scene.add(ambientLight);
        
        // 전면 조명
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
        frontLight.position.set(1, 5, 8); 
        scene.add(frontLight);
        
        // 상단 조명
        const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);
        
        // 측면 조명
        const sideLight = new THREE.DirectionalLight(0xE8FFFF, 0.8);
        sideLight.position.set(10, 2, 0);
        scene.add(sideLight);
        
        // 반사 조명
        const hemisphereLight = new THREE.HemisphereLight(0xE8FFFF, 0x080820, 0.7);
        scene.add(hemisphereLight);
        
        // 오빗 컨트롤 추가
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.autoRotate = false; // 자동 회전 비활성화
        controls.maxPolarAngle = Math.PI / 2.2; // 카메라 회전 범위 제한
        controls.minPolarAngle = Math.PI / 4; // 카메라 회전 범위 제한
        controls.minAzimuthAngle = -Math.PI / 4; // 좌우 회전 범위 제한
        controls.maxAzimuthAngle = Math.PI / 4; // 좌우 회전 범위 제한
        controls.enabled = false; // 사용자 조작 비활성화
        
        // 컨트롤 저장
        if (containerId === 'car-model') {
            carControls = controls;
        } else {
            bicycleControls = controls;
        }
        
        // 로딩 표시기
        const loadingElement = document.createElement('div');
        loadingElement.style.position = 'absolute';
        loadingElement.style.top = '50%';
        loadingElement.style.left = '50%';
        loadingElement.style.transform = 'translate(-50%, -50%)';
        loadingElement.style.color = 'rgba(255, 255, 255, 0.5)';
        loadingElement.style.fontWeight = '300';
        loadingElement.style.fontSize = '14px';
        loadingElement.textContent = 'loading...';
        container.appendChild(loadingElement);
        
        // DRACO 로더 설정
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        
        // GLTF 로더로 모델 로드
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            modelPath,
            (gltf) => {
                // 로딩 표시기 제거
                if (container.contains(loadingElement)) {
                    container.removeChild(loadingElement);
                }
                
                const model = gltf.scene;
                
                // 모델 재질 개선
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            child.material.envMapIntensity = 1.5;
                            child.material.needsUpdate = true;
                        }
                    }
                });
                
                // 모델 크기 조정 및 위치 설정
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3()).length();
                
                // 모델별 스케일 조정 - 크기 비율 유지하며 축소
                let scale;
                if (containerId === 'car-model') {
                    scale = 4.8 / size; // 자동차 모델 크기 축소 (5에서 4.8로)
                } else {
                    scale = 4 / size; // 자전거 모델 크기
                }
                
                model.scale.set(scale, scale, scale);
                
                // 모델을 중앙에 배치
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.sub(center.multiplyScalar(scale));
                
                // 모델별 위치 조정 - 더 뒤로 보이게 각도 조정
                if (containerId === 'car-model') {
                    model.position.y = -1.5; // 더 아래로 내림
                    model.position.z = -2; // 약간 뒤로 이동 
                    model.rotation.y = Math.PI / 2.5; // 더 정면으로 보이게 회전 각도 조정
                    model.rotation.x = -Math.PI / 20; // 약간 기울여서 뒤로 간 느낌 주기
                } else {
                    model.position.y = -1.8; // 더 아래로 내림
                    model.position.z = -2; // 약간 뒤로 이동
                    model.rotation.y = -Math.PI / 2.5; // 더 정면으로 보이게 회전 각도 조정
                    model.rotation.x = -Math.PI / 20; // 약간 기울여서 뒤로 간 느낌 주기
                }
                
                // 둥둥 떠있는 애니메이션 효과 추가
                const modelGroup = new THREE.Group();
                modelGroup.add(model);
                scene.add(modelGroup);
                
                // GSAP으로 둥둥 떠있는 효과 구현
                gsap.to(modelGroup.position, {
                    y: 0.07,
                    duration: 1.5,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
                
                // 매우 미세하게 좌우로 흔들리는 효과
                gsap.to(modelGroup.rotation, {
                    z: 0.005,
                    duration: 2,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
                
                // 렌더링 루프
                const animate = () => {
                    requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                
                animate();
            },
            // 로딩중 콜백
            (xhr) => {
                const percent = xhr.loaded / xhr.total * 100;
                loadingElement.textContent = `${Math.floor(percent)}%`;
            },
            // 에러 콜백
            (error) => {
                console.error(`모델 로딩 실패: ${error}`);
                
                if (container.contains(loadingElement)) {
                    container.removeChild(loadingElement);
                }
                
                // 에러 발생 시 대체 표시
                const errorMessage = document.createElement('div');
                errorMessage.style.width = '100%';
                errorMessage.style.height = '100%';
                errorMessage.style.display = 'flex';
                errorMessage.style.alignItems = 'center';
                errorMessage.style.justifyContent = 'center';
                errorMessage.style.color = 'rgba(255, 255, 255, 0.4)';
                errorMessage.style.fontSize = '14px';
                errorMessage.textContent = '모델 로드 실패';
                container.appendChild(errorMessage);
            }
        );
        
        // 윈도우 리사이즈 처리
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }
    
    // 드래그 시작 이벤트 핸들러
    function onDragStart(event) {
        if (isTransitioning) return;
        
        dragStartX = event.type === 'touchstart' 
            ? event.touches[0].clientX 
            : event.clientX;
    }
    
    // 드래그 이동 이벤트 핸들러
    function onDragMove(event) {
        if (isTransitioning || dragStartX === 0) return;
        
        const currentX = event.type === 'touchmove' 
            ? event.touches[0].clientX 
            : event.clientX;
        const deltaX = currentX - dragStartX;
        
        // 드래그 방향에 따라 실시간 위치 조정
        if (Math.abs(deltaX) > 20) {
            const carElement = document.getElementById('car-model');
            const bicycleElement = document.getElementById('bicycle-model');
            
            if (currentActiveModel === 'car' && deltaX < 0) {
                // 자동차가 오른쪽으로 이동하는 효과
                const progress = Math.min(Math.abs(deltaX) / 200, 0.5); // 최대 50%까지만 미리보기
                
                // 원형 이동으로 미리보기 효과
                animateCircularPreview(carElement, bicycleElement, progress);
            } else if (currentActiveModel === 'bicycle' && deltaX > 0) {
                // 자전거가 왼쪽으로 이동하는 효과
                const progress = Math.min(Math.abs(deltaX) / 200, 0.5); // 최대 50%까지만 미리보기
                
                // 원형 이동으로 미리보기 효과
                animateCircularPreview(bicycleElement, carElement, progress);
            }
        }
    }
    
    // 드래그 종료 이벤트 핸들러
    function onDragEnd(event) {
        if (isTransitioning || dragStartX === 0) return;
        
        const currentX = event.type === 'touchend' 
            ? (event.changedTouches[0].clientX || dragStartX) 
            : event.clientX;
        const deltaX = currentX - dragStartX;
        
        // 드래그 거리가 충분한 경우 모델 전환
        if (Math.abs(deltaX) > 60) { 
            if (currentActiveModel === 'car' && deltaX < 0) {
                // 왼쪽으로 밀면 자동차->자전거
                switchModels('bicycle');
            } else if (currentActiveModel === 'bicycle' && deltaX > 0) {
                // 오른쪽으로 밀면 자전거->자동차
                switchModels('car');
            } else {
                // 반대 방향으로 드래그한 경우 원래 위치로 복귀
                resetModelPositions();
            }
        } else {
            // 드래그 거리가 부족한 경우 원래 위치로 복귀
            resetModelPositions();
        }
        
        dragStartX = 0;
    }
    
    // 위치와 크기 상태 정의
    const frontPosition = { x: -20, y: 0, z: 80, scale: 1.2, opacity: 1 }; // 앞쪽 모델
    const backPosition = { x: 30, y: 0, z: -80, scale: 0.7, opacity: 0.65 }; // 뒤쪽 모델
    
    // 원형 경로를 계산하는 함수 (드래그 미리보기용)
    function animateCircularPreview(frontElement, backElement, progress) {
        // 원형 경로 미리보기 효과는 progress 값(0~0.5)을 기반으로 계산
        // progress 값에 따라 0도에서 90도까지 회전하는 효과 계산
        const angle = progress * Math.PI; // 0 ~ 0.5π (반원의 절반)
        
        // 앞쪽 모델의 원형 이동 경로 계산 (오른쪽 방향으로)
        const frontAngle = angle;
        const frontNewX = frontPosition.x * Math.cos(frontAngle) - backPosition.x * Math.sin(frontAngle);
        const frontNewZ = frontPosition.z * Math.cos(frontAngle) - backPosition.z * Math.sin(frontAngle);
        const frontScale = frontPosition.scale - (frontPosition.scale - backPosition.scale) * progress * 2;
        const frontOpacity = frontPosition.opacity - (frontPosition.opacity - backPosition.opacity) * progress * 2;
        
        // 뒤쪽 모델의 원형 이동 경로 계산 (왼쪽 방향으로)
        const backAngle = angle;
        const backNewX = backPosition.x * Math.cos(backAngle) + frontPosition.x * Math.sin(backAngle);
        const backNewZ = backPosition.z * Math.cos(backAngle) + frontPosition.z * Math.sin(backAngle);
        const backScale = backPosition.scale + (frontPosition.scale - backPosition.scale) * progress * 2;
        const backOpacity = backPosition.opacity + (frontPosition.opacity - backPosition.opacity) * progress * 2;
        
        // 앞에 있는 모델 애니메이션
        gsap.to(frontElement, {
            transform: `translate3d(${frontNewX}%, 0, ${frontNewZ}px) scale(${frontScale})`,
            opacity: frontOpacity,
            duration: 0.1,
            overwrite: true
        });
        
        // 뒤에 있는 모델 애니메이션
        gsap.to(backElement, {
            transform: `translate3d(${backNewX}%, 0, ${backNewZ}px) scale(${backScale})`,
            opacity: backOpacity,
            duration: 0.1,
            overwrite: true
        });
    }
    
    // 모델 전환 함수 - 원형 경로를 따라 움직이는 애니메이션
    function switchModels(targetModel) {
        if (isTransitioning || currentActiveModel === targetModel) return;
        
        isTransitioning = true;
        
        const carElement = document.getElementById('car-model');
        const bicycleElement = document.getElementById('bicycle-model');
        
        // 전환 애니메이션 시간
        const duration = 1.5; // 1.5초로 설정
        
        if (targetModel === 'bicycle') {
            // 자동차 -> 자전거로 전환 (자동차는 왼쪽 반원을 그리며 뒤로, 자전거는 오른쪽 반원을 그리며 앞으로)
            
            // 자동차 애니메이션 (왼쪽 반원을 그리며 뒤로)
            gsap.to(carElement, {
                keyframes: [
                    // 0% - 시작 위치
                    { 
                        transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                        opacity: frontPosition.opacity,
                        duration: 0
                    },
                    // 25% - 왼쪽으로 이동 중
                    { 
                        transform: `translate3d(${frontPosition.x - 15}%, 0, ${frontPosition.z - 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 50% - 반원의 중간 지점
                    { 
                        transform: `translate3d(${(frontPosition.x + backPosition.x)/2 - 15}%, 0, ${(frontPosition.z + backPosition.z)/2}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 75% - 왼쪽 끝으로 이동 중
                    { 
                        transform: `translate3d(${backPosition.x - 15}%, 0, ${backPosition.z + 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 100% - 뒤쪽 최종 위치
                    { 
                        transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                        opacity: backPosition.opacity,
                        duration: duration * 0.25,
                        onComplete: function() {
                            carElement.className = 'model-container back';
                        }
                    }
                ],
                ease: "power2.inOut",
            });
            
            // 자전거 애니메이션 (오른쪽 반원을 그리며 앞으로)
            gsap.to(bicycleElement, {
                keyframes: [
                    // 0% - 시작 위치
                    { 
                        transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                        opacity: backPosition.opacity,
                        duration: 0
                    },
                    // 25% - 오른쪽으로 이동 중
                    { 
                        transform: `translate3d(${backPosition.x + 15}%, 0, ${backPosition.z + 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 50% - 반원의 중간 지점
                    { 
                        transform: `translate3d(${(frontPosition.x + backPosition.x)/2 + 15}%, 0, ${(frontPosition.z + backPosition.z)/2}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 75% - 오른쪽 끝으로 이동 중
                    { 
                        transform: `translate3d(${frontPosition.x + 15}%, 0, ${frontPosition.z - 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 100% - 앞쪽 최종 위치
                    { 
                        transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                        opacity: frontPosition.opacity,
                        duration: duration * 0.25,
                        onComplete: function() {
                            bicycleElement.className = 'model-container front';
                            currentActiveModel = 'bicycle';
                            
                            // 안내 텍스트 업데이트
                            const swipeIndicator = document.querySelector('.swipe-indicator span');
                            if (swipeIndicator) {
                                swipeIndicator.textContent = '밀어서 자동차로 전환';
                            }
                            
                            // 방향 화살표 상태 업데이트
                            updateArrowState();
                            
                            // 전환 완료
                            isTransitioning = false;
                        }
                    }
                ],
                ease: "power2.inOut",
            });
        } else {
            // 자전거 -> 자동차로 전환 (자전거는 왼쪽 반원을 그리며 뒤로, 자동차는 오른쪽 반원을 그리며 앞으로)
            
            // 자전거 애니메이션 (왼쪽 반원을 그리며 뒤로)
            gsap.to(bicycleElement, {
                keyframes: [
                    // 0% - 시작 위치
                    { 
                        transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                        opacity: frontPosition.opacity,
                        duration: 0
                    },
                    // 25% - 왼쪽으로 이동 중
                    { 
                        transform: `translate3d(${frontPosition.x - 15}%, 0, ${frontPosition.z - 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 50% - 반원의 중간 지점
                    { 
                        transform: `translate3d(${(frontPosition.x + backPosition.x)/2 - 15}%, 0, ${(frontPosition.z + backPosition.z)/2}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 75% - 왼쪽 끝으로 이동 중
                    { 
                        transform: `translate3d(${backPosition.x - 15}%, 0, ${backPosition.z + 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 100% - 뒤쪽 최종 위치
                    { 
                        transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                        opacity: backPosition.opacity,
                        duration: duration * 0.25,
                        onComplete: function() {
                            bicycleElement.className = 'model-container back';
                        }
                    }
                ],
                ease: "power2.inOut",
            });
            
            // 자동차 애니메이션 (오른쪽 반원을 그리며 앞으로)
            gsap.to(carElement, {
                keyframes: [
                    // 0% - 시작 위치
                    { 
                        transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                        opacity: backPosition.opacity,
                        duration: 0
                    },
                    // 25% - 오른쪽으로 이동 중
                    { 
                        transform: `translate3d(${backPosition.x + 15}%, 0, ${backPosition.z + 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 50% - 반원의 중간 지점
                    { 
                        transform: `translate3d(${(frontPosition.x + backPosition.x)/2 + 15}%, 0, ${(frontPosition.z + backPosition.z)/2}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 75% - 오른쪽 끝으로 이동 중
                    { 
                        transform: `translate3d(${frontPosition.x + 15}%, 0, ${frontPosition.z - 50}px) scale(${(frontPosition.scale + backPosition.scale)/2})`,
                        opacity: (frontPosition.opacity + backPosition.opacity)/2,
                        duration: duration * 0.25
                    },
                    // 100% - 앞쪽 최종 위치
                    { 
                        transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                        opacity: frontPosition.opacity,
                        duration: duration * 0.25,
                        onComplete: function() {
                            carElement.className = 'model-container front';
                            currentActiveModel = 'car';
                            
                            // 안내 텍스트 업데이트
                            const swipeIndicator = document.querySelector('.swipe-indicator span');
                            if (swipeIndicator) {
                                swipeIndicator.textContent = '밀어서 자전거로 전환';
                            }
                            
                            // 방향 화살표 상태 업데이트
                            updateArrowState();
                            
                            // 전환 완료
                            isTransitioning = false;
                        }
                    }
                ],
                ease: "power2.inOut",
            });
        }
    }
    
    // 모델 위치 초기화 함수
    function resetModelPositions() {
        const carElement = document.getElementById('car-model');
        const bicycleElement = document.getElementById('bicycle-model');
        
        if (currentActiveModel === 'car') {
            gsap.to(carElement, {
                transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                opacity: frontPosition.opacity,
                duration: 0.3
            });
            gsap.to(bicycleElement, {
                transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                opacity: backPosition.opacity,
                duration: 0.3
            });
        } else {
            gsap.to(bicycleElement, {
                transform: `translate3d(${frontPosition.x}%, 0, ${frontPosition.z}px) scale(${frontPosition.scale})`,
                opacity: frontPosition.opacity,
                duration: 0.3
            });
            gsap.to(carElement, {
                transform: `translate3d(${backPosition.x}%, 0, ${backPosition.z}px) scale(${backPosition.scale})`,
                opacity: backPosition.opacity,
                duration: 0.3
            });
        }
    }
    
    // 방향 화살표 상태 업데이트 함수
    function updateArrowState() {
        const leftArrow = document.querySelector('.arrow.left');
        const rightArrow = document.querySelector('.arrow.right');
        
        if (leftArrow && rightArrow) {
            if (currentActiveModel === 'car') {
                leftArrow.style.opacity = '0.3'; // 자동차 상태에서 왼쪽 화살표 비활성화
                rightArrow.style.opacity = '1';
            } else {
                leftArrow.style.opacity = '1';
                rightArrow.style.opacity = '0.3'; // 자전거 상태에서 오른쪽 화살표 비활성화
            }
        }
    }
    
    // 초기 화살표 상태 설정
    updateArrowState();
});