// 필요한 Three.js 모듈 가져오기
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// carSearch.js

// DOM Element References (Ensure these IDs exist in carModels.jsp)
const carSelect = document.getElementById('carSelect');
const fuelPriceInput = document.getElementById('fuelPriceInput');
const searchBtn = document.getElementById('searchBtn');
const convertBtn = document.getElementById('convertBtn');
const resetBtn = document.getElementById('resetBtn');
const resultContainer = document.getElementById('resultContainer');
const canvasContainer = document.getElementById('canvas-container');

// Loading element
const loadingElement = document.createElement('div');
loadingElement.id = 'loading';
canvasContainer.appendChild(loadingElement);

// Car Info Box Elements
const carModelName = document.getElementById('carModelName');
const fuelType = document.getElementById('fuelType');
const emission = document.getElementById('emission');
const efficiency = document.getElementById('efficiency');

// DOM ELEMENTS FOR CALCULATION RESULTS (MUST MATCH JSP IDs from previous carModels.jsp correction)
const originalAnnualCo2Span = document.getElementById('originalAnnualCo2');
const electricAnnualCo2Span = document.getElementById('electricAnnualCo2'); // Corrected ID in JSP
const annualCo2ReductionText = document.getElementById('annualCo2ReductionText'); // Corrected ID in JSP
const annualCo2ReductionPercentage = document.getElementById('annualCo2ReductionPercentage'); // Corrected ID in JSP

const originalTenYearCo2Span = document.getElementById('originalTenYearCo2');
const electricTenYearCo2Span = document.getElementById('electricTenYearCo2'); // Corrected ID in JSP
const tenYearCo2ReductionText = document.getElementById('tenYearCo2ReductionText'); // Corrected ID in JSP
const tenYearCo2ReductionPercentage = document.getElementById('tenYearCo2ReductionPercentage'); // Corrected ID in JSP

const treeIconsContainer = document.getElementById('treeIcons');
const treePlantingEffectText = document.getElementById('treePlantingEffectText');

const originalAnnualFuelCostSpan = document.getElementById('originalAnnualFuelCost');
const electricAnnualFuelCostSpan = document.getElementById('electricAnnualFuelCost');
const annualFuelCostSavingsText = document.getElementById('annualFuelCostSavingsText'); // Corrected ID in JSP
const annualFuelCostSavingsPercentage = document.getElementById('annualFuelCostSavingsPercentage'); // Corrected ID in JSP

// Sidebar elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar'); // Corrected variable name
const body = document.body;
const mainContent = document.querySelector('.container');

// Global variables for selected car models
let currentSelectedGasolineModel = null; // Stores the model selected from the dropdown (always gasoline initially)

// Three.js variables
let scene, camera, renderer, controls;
let currentCar = null;
let mixer = null;
let clock = new THREE.Clock();
let floor; // Global floor reference

// 차량 모델별 GLB 파일 매핑
const carModelsGLB = {
    "AUDI SQ8": "./img/A7.glb",
    "BMW 530i": "./img/bmw.glb",
    "CHEVROLET Silverado": "./img/Silverado.glb",
    "GENESIS G80": "./img/g70.glb",
    "HYUNDAI Kona": "./img/kona.glb",
	"KIA Niro": "./img/stonic.glb",
	"MERCEDES-BENZ AMG G63": "./img/g63.glb",
	"PORSCHE Macan": "./img/macan.glb",
	"FORD F150": "./img/ford.glb",
    // Add default GLB for Electric cars if they appear in the initial list
    "BMW i5 eDrive40 Sedan": "./img/ioniq.glb", // Example electric car
    "GENESIS Electrified G80": "./img/ioniq.glb",
    "HYUNDAI Kona Electric": "./img/ioniq.glb",
    "KIA Niro EV": "./img/ioniq.glb",
};

// This mapping explicitly states which EV model replaces which Gasoline model for conversion
const electricCarMapping = {
    "BMW 530i": {
        name: "BMW i5 eDrive40 Sedan", // This is the actual DB model name for the electric equivalent
        glb: "./img/ioniq.glb" // Or a specific GLB for this EV
    },
    "GENESIS G80": {
        name: "GENESIS Electrified G80",
        glb: "./img/ioniq.glb"
    },
    "HYUNDAI Kona": {
        name: "HYUNDAI Kona Electric",
        glb: "./img/ioniq.glb"
    },
    "KIA Niro": {
        name: "KIA Niro EV",
        glb: "./img/ioniq.glb"
    },
	"MERCEDES-BENZ AMG G63" :{
		name: "MERCEDES-BENZ G 580 with EQ Technology",
		glb: "./img/ioniq.glb"
	}
};

// --- Initialization ---
function init() {
    initThreeJS();
    setupEventListeners();
    // Initial state: hide convert button and result container
    convertBtn.style.display = 'none';
    resultContainer.style.display = 'none';
}

// --- Three.js Setup ---
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f5);

    camera = new THREE.PerspectiveCamera(45, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(5, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    canvasContainer.appendChild(renderer.domElement);

    setupLights();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;

    createFloor();

    animate();

    window.addEventListener('resize', handleResize);
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
}

function createFloor() {
    const floorGeometry = new THREE.CircleGeometry(10, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.8,
        metalness: 0.2
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.name = "floor";
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

// --- Event Listeners ---
function setupEventListeners() {
    searchBtn.addEventListener('click', searchCarModel);
    convertBtn.addEventListener('click', convertToCar);
    resetBtn.addEventListener('click', resetSimulation);

    // Sidebar event listeners
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        body.classList.add('sidebar-open');
        if (mainContent) {
            mainContent.style.pointerEvents = 'none';
        }
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
        body.classList.remove('sidebar-open');
        if (mainContent) {
            mainContent.style.pointerEvents = 'all';
        }
    });

    // Close sidebar if main content is clicked when sidebar is open (on mobile)
    if (mainContent) {
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                body.classList.remove('sidebar-open');
                mainContent.style.pointerEvents = 'all';
            }
        });
    }
}

// --- Car Model Search & Info Update ---
async function searchCarModel() {
    const selectedModel = carSelect.value;
    const fuelPricePerLiter = parseFloat(fuelPriceInput.value);

    if (!selectedModel) {
        alert("차량 모델을 선택하세요.");
        return;
    }
    if (isNaN(fuelPricePerLiter) || fuelPricePerLiter <= 0) {
        alert("유가를 정확히 입력하세요.");
        return;
    }

    loadingElement.style.display = 'block';
    loadingElement.innerHTML = `${selectedModel} 모델 정보를 불러오는 중...`;

    try {
        const response = await fetch(`/car/info?model=${encodeURIComponent(selectedModel)}`);
        if (!response.ok) {
            throw new Error(`차량 정보를 불러올 수 없습니다. 상태 코드: ${response.status}`);
        }
        const data = await response.json();
        console.log("✅ 검색된 차량 정보:", data);

        updateCarInfo(selectedModel, data); // Update top car info box

        // Load 3D model
        loadCarModelGLB(selectedModel);

        // Store the current selected gasoline car model
        if (data.fuel.toLowerCase() === "gasoline") {
            currentSelectedGasolineModel = selectedModel;
            convertBtn.style.display = 'block'; // Show convert button for gasoline cars
            convertBtn.disabled = false;
            convertBtn.classList.add('highlight-pulse');
        } else {
            // If an EV is selected initially, clear stored gasoline model and hide convert button
            currentSelectedGasolineModel = null;
            convertBtn.style.display = 'none';
            convertBtn.disabled = true;
            convertBtn.classList.remove('highlight-pulse');
            alert("전기차로 변환 효과를 보려면 먼저 휘발유 차량을 검색해 주세요.");
        }
        resultContainer.style.display = 'none'; // Hide results until conversion is clicked
    } catch (error) {
        console.error("차량 정보 로드 오류:", error);
        alert("차량 정보 로드 오류: " + error.message);
        loadingElement.style.display = 'none';
    }
}

// Updates the top car info display (연료, CO2 배출량, 연비)
function updateCarInfo(modelName, data) {
    console.log("✅ updateCarInfo 데이터:", data);
    carModelName.textContent = modelName;
    fuelType.textContent = data.fuel || '-';

    // Ensure emission displays correctly for electric cars (0 g/km)
    if (data.fuel && data.fuel.toLowerCase() === "electricity") {
        emission.textContent = "0 g/km";
    } else {
        emission.textContent = (data.combCo2 !== null && data.combCo2 !== undefined) ? `${data.combCo2} g/km` : "- g/km";
    }

    // `efficiency` is already formatted from backend
    efficiency.textContent = data.efficiency || "-";
}

// --- Three.js Model Loading ---
// scene에서 모든 모델을 완전히 제거하는 함수
function clearScene() {
    const objectsToRemove = [];
    scene.traverse((object) => {
        // Exclude the floor from removal
        if (object.isMesh && object.name !== "floor") {
            objectsToRemove.push(object);
        }
    });

    objectsToRemove.forEach((object) => {
        console.log("씬에서 제거 중:", object.name || "이름 없는 객체");
        object.geometry?.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
        if (object.parent) {
            object.parent.remove(object);
        }
    });

    if (currentCar) {
        console.log("currentCar 객체 초기화");
        currentCar = null;
    }
    if (mixer) {
        mixer = null;
    }
    console.log("씬 정리 완료, 남은 객체 수 (바닥 포함):", scene.children.length);
}

// 차량 모델 GLB 로드 함수
function loadCarModelGLB(modelName, overridePath = null) {
    let glbPath = overridePath || carModelsGLB[modelName] || './img/default.glb';

    console.log(`모델 로드 시작: ${modelName}, 경로: ${glbPath}`);
    clearScene(); // Clear previous model before loading new one

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = function() {
        loadingElement.style.display = 'none';
        console.log(`${modelName} 모델 로드 완료`);
    };

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');

    const gltfLoader = new GLTFLoader(loadingManager);
    gltfLoader.setDRACOLoader(dracoLoader);

    loadingElement.style.display = 'block';
    loadingElement.innerHTML = `${modelName} 모델을 로드하는 중...`;

    gltfLoader.load(
        glbPath,
        function(gltf) {
            console.log(`${modelName} 모델 로드 성공!`, gltf);
            currentCar = gltf.scene;
            currentCar.name = modelName.replace(/\s+/g, '_'); // Assign a valid name

            currentCar.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(currentCar);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            const box = new THREE.Box3().setFromObject(currentCar);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);

            const scale = 3 / maxSize; // Scale car to fit within 3 units
            currentCar.scale.set(scale, scale, scale);
            currentCar.position.y = 0.01; // Place slightly above floor

            scene.add(currentCar);

            camera.position.set(5, 2, 5); // Reset camera position
            controls.target.set(0, 1, 0); // Point camera at center of car
            controls.update();

            // GSAP animations for new car appearance
            gsap.from(currentCar.position, {
                y: -2,
                duration: 1.5,
                ease: "power2.out"
            });

            gsap.from(currentCar.rotation, {
                y: Math.PI * 2, // Full rotation
                duration: 2,
                ease: "power2.out"
            });

            searchBtn.classList.remove('highlight-pulse'); // Remove highlight after search
        },
        function(xhr) {
            const percent = xhr.loaded / xhr.total * 100;
            loadingElement.innerHTML = `${modelName} 로딩 중... ${Math.floor(percent)}%`;
            console.log(`${modelName} 로딩 진행률: ${Math.floor(percent)}%`);
        },
        function(error) {
            console.error(`GLB 모델 로드 오류 (${modelName}):`, error);
            loadingElement.innerHTML = `
                <div style="color: red;">
                    ${modelName} 모델을 로드하는 중 오류가 발생했습니다.<br>
                    경로를 확인해주세요: ${glbPath}
                </div>
            `;
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 5000);
        }
    );
}

// --- Conversion Logic ---
async function convertToCar() {
    convertBtn.disabled = true;
    convertBtn.classList.remove('highlight-pulse');

    const originalGasolineModel = currentSelectedGasolineModel; // Use the stored gasoline model
    const electricData = electricCarMapping[originalGasolineModel]; // Get EV equivalent from map
    const fuelPricePerLiter = parseFloat(fuelPriceInput.value);

    if (!originalGasolineModel) {
        alert("먼저 휘발유 차량을 선택하고 검색해주세요.");
        return;
    }
    if (!electricData) {
        alert(`선택된 휘발유 차량(${originalGasolineModel})에 대한 전기차 변환 정보가 없습니다.`);
        return;
    }
    if (isNaN(fuelPricePerLiter) || fuelPricePerLiter <= 0) {
        alert("유가를 정확히 입력하세요.");
        return;
    }

    console.log(`변환 시작: ${originalGasolineModel} → ${electricData.name}`);

    // GSAP animation for current car disappearing
    if (currentCar) {
        gsap.to(currentCar.rotation, {
            y: currentCar.rotation.y + Math.PI * 4,
            duration: 2,
            ease: "power2.inOut"
        });

        gsap.to(currentCar.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 1.5,
            delay: 0.5,
            ease: "power3.in",
            onComplete: async function() {
                clearScene(); 
                console.log("모델 제거 완료, 새 전기차 모델 로드 예정");

                loadingElement.style.display = 'block';
                loadingElement.innerHTML = `${electricData.name} 모델을 로드하는 중...`;

                loadCarModelGLB(electricData.name, electricData.glb); 

                try {
                    const conversionResponse = await fetch(`/ev/calculateConversion?electricCarModel=${encodeURIComponent(electricData.name)}&fuelPrice=${fuelPricePerLiter}&originalCarModel=${encodeURIComponent(originalGasolineModel)}`);
                    if (!conversionResponse.ok) {
                        throw new Error(`전기차 변환 효과를 불러올 수 없습니다. 상태 코드: ${conversionResponse.status}`);
                    }
                    const calculationResults = await conversionResponse.json();
                    console.log("✅ 계산 결과:", calculationResults);

                    // Update top car info box with EV details
                    updateCarInfo(electricData.name, {
                        fuel: calculationResults.currentCarFuel,
                        efficiency: calculationResults.currentCarEfficiency,
                        combCo2: calculationResults.currentCarCombCo2
                    });
                    // Update conversion results section
                    updateCalculationResults(calculationResults);
                    showResults(); // Show the results container
                } catch (err) {
                    console.error("⚠ 전기차 변환 효과 로딩 실패:", err);
                    // Provide fallback values for display if calculation fails
                    updateCalculationResults({
                        originalAnnualCo2: 0, electricAnnualCo2: 0, annualCo2Reduction: 0, tenYearCo2Reduction: 0,
                        originalTenYearCo2: 0, treePlantingEffect: 0,
                        originalAnnualFuelCost: 0, electricAnnualFuelCost: 0, annualFuelCostSavings: 0
                    });
                    showResults(); 
                }
            }
        });

        gsap.to(currentCar.position, {
            y: 3,
            duration: 2,
            delay: 0.7,
            ease: "power2.in"
        });

        // Visual transition effect
        const transitionEffect = document.createElement('div');
        transitionEffect.className = 'car-transition-effect';
        canvasContainer.appendChild(transitionEffect);
        setTimeout(() => {
            transitionEffect.classList.add('active');
            setTimeout(() => {
                if (canvasContainer.contains(transitionEffect)) {
                    canvasContainer.removeChild(transitionEffect);
                }
            }, 2000);
        }, 500);

    } else {
        // Fallback if currentCar is null (shouldn't happen with normal flow)
        console.warn("currentCar is null, skipping animation and directly loading EV model.");
        clearScene();
        loadCarModelGLB(electricData.name, electricData.glb);

        try {
            const conversionResponse = await fetch(`/ev/calculateConversion?electricCarModel=${encodeURIComponent(electricData.name)}&fuelPrice=${fuelPricePerLiter}&originalCarModel=${encodeURIComponent(originalGasolineModel)}`);
            if (!conversionResponse.ok) {
                throw new Error("전기차 변환 효과를 불러올 수 없습니다.");
            }
            const calculationResults = await conversionResponse.json();
            console.log("✅ 계산 결과 (Fallback):", calculationResults);

            updateCarInfo(electricData.name, {
                fuel: calculationResults.currentCarFuel,
                efficiency: calculationResults.currentCarEfficiency,
                combCo2: calculationResults.currentCarCombCo2
            });
            updateCalculationResults(calculationResults);
            showResults();
        } catch (err) {
            console.error("⚠ 전기차 변환 효과 로딩 실패 (Fallback):", err);
            alert("전기차 변환 효과를 가져오는 데 실패했습니다 (Fallback): " + err.message);
            updateCalculationResults({
                originalAnnualCo2: 0, electricAnnualCo2: 0, annualCo2Reduction: 0, tenYearCo2Reduction: 0,
                originalTenYearCo2: 0, treePlantingEffect: 0,
                originalAnnualFuelCost: 0, electricAnnualFuelCost: 0, annualFuelCostSavings: 0
            });
            showResults();
        }
    }
}

function updateCalculationResults(data) {
    // Helper function to safely parse and format numbers
    const formatNumber = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toFixed(0).toLocaleString();
    };

    // Original values
    const originalAnnualCo2Num = parseFloat(data.originalAnnualCo2) || 0;
    const originalTenYearCo2Num = parseFloat(data.originalTenYearCo2) || 0;
    const originalAnnualFuelCostNum = parseFloat(data.originalAnnualFuelCost) || 0;

    const electricAnnualCo2Num = parseFloat(data.electricAnnualCo2) || 0;
    const electricTenYearCo2Num = parseFloat(data.electricTenYearCo2) || 0;
    const electricAnnualFuelCostNum = parseFloat(data.electricAnnualFuelCost) || 0;

    const annualCo2Reduced = parseFloat(data.annualCo2Reduction) || 0;
    const tenYearCo2Reduced = parseFloat(data.tenYearCo2Reduction) || 0;
    const treesSaved = parseInt(data.treePlantingEffect) || 0;
    const fuelSaved = parseFloat(data.annualFuelCostSavings) || 0;

    // Display original and electric values
    originalAnnualCo2Span.textContent = formatNumber(originalAnnualCo2Num);
    originalTenYearCo2Span.textContent = formatNumber(originalTenYearCo2Num);
    originalAnnualFuelCostSpan.textContent = formatNumber(originalAnnualFuelCostNum);

    electricAnnualCo2Span.textContent = formatNumber(electricAnnualCo2Num);
    electricTenYearCo2Span.textContent = formatNumber(electricTenYearCo2Num);
    electricAnnualFuelCostSpan.textContent = formatNumber(electricAnnualFuelCostNum);

    // CO2 Reduction
    annualCo2ReductionText.textContent = `${formatNumber(annualCo2Reduced)} kg 절감`;
    const annualCo2Percent = (originalAnnualCo2Num > 0) ? ((annualCo2Reduced / originalAnnualCo2Num) * 100) : 0;
    annualCo2ReductionPercentage.textContent = `${Math.round(annualCo2Percent)}% 감소`;

    tenYearCo2ReductionText.textContent = `${formatNumber(tenYearCo2Reduced)} kg 절감`;
    const tenYearCo2Percent = (originalTenYearCo2Num > 0) ? ((tenYearCo2Reduced / originalTenYearCo2Num) * 100) : 0;
    tenYearCo2ReductionPercentage.textContent = `${Math.round(tenYearCo2Percent)}% 감소`;

    // Tree Planting Effect
    treePlantingEffectText.textContent = `약 ${formatNumber(treesSaved)}그루의 나무 심은 효과`;
    treeIconsContainer.innerHTML = "";
    for (let i = 0; i < Math.min(treesSaved, 10); i++) {
        const img = document.createElement('img');
        img.src = './img/tree.png';
        img.alt = 'tree';
        img.style.width = '30px';
        img.style.height = '30px';
        img.style.margin = '2px';
        treeIconsContainer.appendChild(img);
    }

    // Fuel Cost Savings
    annualFuelCostSavingsText.textContent = `${formatNumber(fuelSaved)} 원 절감`;
    const fuelSavingsPercent = (originalAnnualFuelCostNum > 0) ? ((fuelSaved / originalAnnualFuelCostNum) * 100) : 0;
    annualFuelCostSavingsPercentage.textContent = `약 ${Math.round(fuelSavingsPercent)}% 절감`;

    // Animate counters
    animateCounters(
        annualCo2Reduced,
        tenYearCo2Reduced,
        treesSaved,
        fuelSaved,
        originalAnnualCo2Num,
        originalTenYearCo2Num,
        originalAnnualFuelCostNum
    );
}


// Show Results Container with GSAP animation
function showResults() {
    resultContainer.style.display = 'block';
    gsap.from(resultContainer, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out"
    });
}

// Number Counting Animation
function animateCounters(annualCo2, tenYearCo2, trees, fuelSavings, originalAnnualCo2, originalTenYearCo2, originalFuelCost) {
    // Initial display values for animation start
    annualCo2ReductionText.textContent = '0 kg 절감';
    tenYearCo2ReductionText.textContent = '0 kg 절감';
    treePlantingEffectText.textContent = '약 0그루의 나무 심은 효과';
    annualFuelCostSavingsText.textContent = '0 원 절감';
    annualCo2ReductionPercentage.textContent = '0% 감소';
    tenYearCo2ReductionPercentage.textContent = '0% 감소';
    annualFuelCostSavingsPercentage.textContent = '약 0% 절감';

    // Animate annual CO2 reduction text and percentage
    gsap.fromTo({ currentVal: 0 }, {
        currentVal: annualCo2,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
            const val = Math.round(this.targets()[0].currentVal);
            annualCo2ReductionText.textContent = `${val.toLocaleString()} kg 절감`;
            const percentage = (originalAnnualCo2 > 0) ? ((val / originalAnnualCo2) * 100) : 0;
            annualCo2ReductionPercentage.textContent = `${Math.min(100, Math.round(percentage))}% 감소`;
        },
        onComplete: function() {
            // Final check to ensure 100% if reduction is significant
            if (annualCo2 > 0) annualCo2ReductionPercentage.textContent = '100% 감소';
        }
    });

    // Animate 10-year CO2 reduction text and percentage
    gsap.fromTo({ currentVal: 0 }, {
        currentVal: tenYearCo2,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
            const val = Math.round(this.targets()[0].currentVal);
            tenYearCo2ReductionText.textContent = `${val.toLocaleString()} kg 절감`;
            const percentage = (originalTenYearCo2 > 0) ? ((val / originalTenYearCo2) * 100) : 0;
            tenYearCo2ReductionPercentage.textContent = `${Math.min(100, Math.round(percentage))}% 감소`;
        },
        onComplete: function() {
            if (tenYearCo2 > 0) tenYearCo2ReductionPercentage.textContent = '100% 감소';
        }
    });

    // Animate tree planting effect
    gsap.fromTo({ currentVal: 0 }, {
        currentVal: trees,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
            const val = Math.round(this.targets()[0].currentVal);
            treePlantingEffectText.textContent = `약 ${val.toLocaleString()}그루의 나무 심은 효과`;
        }
    });

    // Animate fuel cost savings text and percentage
    gsap.fromTo({ currentVal: 0 }, {
        currentVal: fuelSavings,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
            const val = Math.round(this.targets()[0].currentVal);
            annualFuelCostSavingsText.textContent = `${val.toLocaleString()} 원 절감`;
            const percentage = (originalFuelCost > 0) ? ((val / originalFuelCost) * 100) : 0;
            annualFuelCostSavingsPercentage.textContent = `약 ${Math.round(percentage)}% 절감`;
        }
    });
}


// --- Reset Simulation ---
function resetSimulation() {
    resultContainer.style.display = 'none'; // Hide results

    // Reset displayed car info
    carModelName.textContent = "차량 모델";
    fuelType.textContent = "-";
    emission.textContent = "-";
    efficiency.textContent = "-";

    // Reset dropdown
    carSelect.value = ""; // Select the default "-- 차량 모델 선택 --" option
    fuelPriceInput.value = ""; // Clear fuel price input

    // Reset calculation values to '0' or '-'
    originalAnnualCo2Span.textContent = '0';
    electricAnnualCo2Span.textContent = '0';
    annualCo2ReductionText.textContent = '0 kg 절감';
    annualCo2ReductionPercentage.textContent = '0% 감소';

    originalTenYearCo2Span.textContent = '0';
    electricTenYearCo2Span.textContent = '0';
    tenYearCo2ReductionText.textContent = '0 kg 절감';
    tenYearCo2ReductionPercentage.textContent = '0% 감소';

    treeIconsContainer.innerHTML = "";
    treePlantingEffectText.textContent = '약 0그루의 나무 심은 효과';

    originalAnnualFuelCostSpan.textContent = '0';
    electricAnnualFuelCostSpan.textContent = '0';
    annualFuelCostSavingsText.textContent = '0 원 절감';
    annualFuelCostSavingsPercentage.textContent = '약 0% 절감';

    // Clear 3D scene and reset currentCar
    clearScene();
    currentCar = null;
    if (mixer) {
        mixer = null;
    }

    // Reset button states
    convertBtn.style.display = 'none'; // Hide convert button
    convertBtn.disabled = true;
    convertBtn.classList.remove('highlight-pulse');

    currentSelectedGasolineModel = null; // Clear stored gasoline model
}

// --- Responsive Handling ---
function handleResize() {
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }

    if (controls) {
        controls.update();
    }

    if (currentCar) {
        currentCar.rotation.y += delta * 0.05; // Gentle rotation
    }

    renderer.render(scene, camera);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);