
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const body = document.body;

    menuToggle.addEventListener('click', function () {
        sidebar.classList.add('active');
        body.classList.add('sidebar-open');
        if (Chart.instances) {
            Object.values(Chart.instances).forEach(chart => chart?.resize?.());
        }
    });

    closeSidebar.addEventListener('click', function () {
        sidebar.classList.remove('active');
        body.classList.remove('sidebar-open');
    });

    document.querySelector('.eco-dashboard').addEventListener('click', function () {
        if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            body.classList.remove('sidebar-open');
        }
    });

    window.addEventListener('resize', function () {
        if (sidebar.classList.contains('active')) {
            Object.values(Chart.instances).forEach(chart => chart?.resize?.());
        }
    });
	
	
    function loadData() {
        renderCO2EmissionsChart();
        renderVehicleEmissionsChart();
        renderEVGrowthChart();
        renderChargingStationsChart();
        initMapEventListeners();
    }

    function renderCO2EmissionsChart() {
        const ctx = document.getElementById('co2-emissions-chart').getContext('2d');
        const co2Data = (window.data && window.data.co2Emissions) || [];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: co2Data.map(item => item.year),
                datasets: [{
                    label: 'CO2 배출량 (톤)',
                    data: co2Data.map(item => item.amount),
                    fill: true,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: 'rgba(129, 199, 132, 1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    },
                    legend: {
                        position: 'top',
                        labels: { font: { size: 12 }, color: '#666' }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#666' } },
                    x: { grid: { display: false }, ticks: { color: '#666' } }
                }
            }
        });
    }

    function renderVehicleEmissionsChart() {
        const ctx = document.getElementById('vehicle-emissions-chart').getContext('2d');
        const emissionsData = window.data.vehicleEmissions || [];
        const chartColors = ['#6ABF69', '#A1D99B', '#C7E9C0', '#E5F5E0'];

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['승용차', '승합차', '화물차', '특수차'],
                datasets: [{
                    data: emissionsData,
                    backgroundColor: chartColors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: '#ccc',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toLocaleString()} tCO₂`
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: { font: { size: 12 }, color: '#666', padding: 15 }
                    }
                }
            }
        });
    }

    function renderEVGrowthChart() {
        const ctx = document.getElementById('ev-growth-chart').getContext('2d');
        const evData = (window.data && window.data.evGrowth) || [];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: evData.map(item => item.year),
                datasets: [{
                    label: '전기차 대수',
                    data: evData.map(item => item.total),
                    fill: false,
                    borderColor: 'rgba(76, 175, 80, 1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: 'rgba(129, 199, 132, 1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: ctx => `${ctx.raw} 대`
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: { font: { size: 12 }, color: '#666' }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#666' } },
                    x: { grid: { display: false }, ticks: { color: '#666' } }
                }
            }
        });
    }

    function renderChargingStationsChart() {
        const canvas = document.getElementById('charging-stations-chart');
        if (!canvas) {
            console.warn("⛔ <canvas id='charging-stations-chart'> 요소가 존재하지 않습니다.");
            return;
        }

        const ctx = canvas.getContext('2d');
        const stationData = (window.data && window.data.guCharge) || [];

        if (!stationData.length) {
            console.warn("⚠️ guCharge 데이터가 비어 있습니다.");
            return;
        }

        const colorPalette = [
            'rgba(76, 175, 80, 0.6)',
            'rgba(129, 199, 132, 0.6)',
            'rgba(165, 214, 167, 0.6)',
            'rgba(200, 230, 201, 0.6)',
            'rgba(232, 245, 233, 0.6)'
        ];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stationData.map(item => item.gu),
                datasets: [{
                    label: '충전소 수',
                    data: stationData.map(item => item.total),
                    backgroundColor: stationData.map((_, i) => colorPalette[i % colorPalette.length]),
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: '#4CAF50',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: ctx => `${ctx.raw} 개`
                        }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#666' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#666' }
                    }
                }
            }
        });
    }

   

    // ✅ raw 데이터 → 가공
    const rawGuChargeData = [
        { CHARGER_COUNT: 1188, SIGUNGU: '대덕구' },
        { CHARGER_COUNT: 1544, SIGUNGU: '동구' },
        { CHARGER_COUNT: 3516, SIGUNGU: '서구' },
        { CHARGER_COUNT: 4927, SIGUNGU: '유성구' },
        { CHARGER_COUNT: 1561, SIGUNGU: '중구' }
    ];

    window.data = window.data || {};
    window.data.guCharge = rawGuChargeData.map(item => ({
        gu: item.SIGUNGU,
        total: item.CHARGER_COUNT
    }));

    // 🔥 실행
    loadData();
	
	// 현재 날짜 및 시간 표시
    function updateDateTime() {
        const now = new Date();
        
        // 날짜 포맷 (YYYY년 MM월 DD일)
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const formattedDate = `${year}년 ${month}월 ${day}일`;
        
        // 시간 포맷 (HH:MM)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;
        
        // 요일
        const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const weekday = weekdays[now.getDay()];
        
        // UI 업데이트
        document.getElementById('current-date').textContent = `${formattedDate} ${weekday}`;
        document.getElementById('current-time').textContent = `현재 시간: ${formattedTime}`;
        
        // 현재 확률 업데이트 (실제로는 서버에서 받아오겠지만, 여기서는 시간에 따라 샘플 데이터 생성)
        updateCurrentProbability(now.getHours());
    }
    
    // 초기 로드 및 1분마다 갱신
    updateDateTime();
    setInterval(updateDateTime, 60000);
	
	
});

