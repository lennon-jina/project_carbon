// calculator.js
// 상수 정의 (파이썬 코드와 동일한 값 사용)
const BIKE_SPEED_KMPH = 15;
const KM_PER_MIN = BIKE_SPEED_KMPH / 60;
const CO2_PER_KM = 175; // 자동차가 km당 배출하는 CO₂ 그램

// 휴대폰 충전 1회당 배출되는 CO₂ (약 8g으로 가정)
const CO2_PER_PHONE_CHARGE = 8;

// 나무 1그루가 연간 흡수하는 CO₂ 양 (약 22kg = 22000g으로 가정)
const CO2_PER_TREE_YEAR = 22000;
const CO2_PER_TREE_DAY = CO2_PER_TREE_YEAR / 365;

// 페이지 로드 시 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 현재 날짜 표시
    const now = new Date();
    const dateString = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    
    // 계산하기 버튼 클릭 시 이벤트 등록
    document.getElementById('calculate-btn').addEventListener('click', function() {
        const durationInput = document.getElementById('duration').value;
        
        // 입력값 유효성 검사
        if (durationInput === '' || isNaN(durationInput) || durationInput <= 0) {
            alert('유효한 시간(분)을 입력해주세요!');
            return;
        }
        
        const duration = parseFloat(durationInput);
        calculateAndDisplay(duration);
    });
    
    // 사이드바 토글 기능
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const menuOverlay = document.getElementById('menu-overlay');
    const body = document.body;
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
        menuOverlay.classList.add('open');
        body.classList.add('sidebar-open'); // 사이드바 열릴 때 body에 클래스 추가
    });
    
    closeSidebar.addEventListener('click', function() {
        sidebar.classList.remove('active');
        menuOverlay.classList.remove('open');
        body.classList.remove('sidebar-open'); // 사이드바 닫힐 때 body에서 클래스 제거
    });
    
    menuOverlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        menuOverlay.classList.remove('open');
        body.classList.remove('sidebar-open');
    });
    
    // 메인 콘텐츠 클릭시 사이드바 닫기 (모바일 환경에서 사용성 향상)
    document.querySelector('.container').addEventListener('click', function(e) {
        if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            menuOverlay.classList.remove('open');
            body.classList.remove('sidebar-open');
        }
    });
});

// 계산 및 화면 표시 함수
function calculateAndDisplay(duration) {
    // 1. 거리 계산 (km)
    const distance = duration * KM_PER_MIN;
    
    // 2. 절감된 CO₂ 계산 (g)
    const co2Saved = distance * CO2_PER_KM;
    
    // 3. 환경 영향 계산
    // 나무 심은 효과 (일일 기준)
    const treeEquivalent = co2Saved / CO2_PER_TREE_DAY;
    
    // 휴대폰 충전 횟수
    const phoneChargeEquivalent = Math.round(co2Saved / CO2_PER_PHONE_CHARGE);
    
    // 4. 화면에 표시
    document.getElementById('distance').textContent = `${distance.toFixed(2)} km`;
    document.getElementById('co2-saved').textContent = `${co2Saved.toFixed(2)} g`;
    document.getElementById('tree-equivalent').textContent = treeEquivalent.toFixed(2);
    document.getElementById('charging-equivalent').textContent = phoneChargeEquivalent;
    document.getElementById('car-emissions').textContent = `${co2Saved.toFixed(2)}g CO₂`;
    
    // 5. 결과 영역 보이게 하기
    document.getElementById('results').style.display = 'flex';
    document.getElementById('eco-impact').style.display = 'block';
    document.getElementById('visualization').style.display = 'block';
}