document.addEventListener('DOMContentLoaded', function() {
    // 사이드바 토글 기능
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const body = document.body;
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
        body.classList.add('sidebar-open'); // 사이드바 열릴 때 body에 클래스 추가
    });
    
    closeSidebar.addEventListener('click', function() {
        sidebar.classList.remove('active');
        body.classList.remove('sidebar-open'); // 사이드바 닫힐 때 body에서 클래스 제거
    });
    
    // 메인 콘텐츠 클릭시 사이드바 닫기 (모바일 환경에서 사용성 향상)
    document.querySelector('.bike-dashboard').addEventListener('click', function(e) {
        if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            body.classList.remove('sidebar-open');
        }
    });
    
    // 데이터는 나중에 오라클 DB에서 가져올 예정
    // 현재는 샘플 데이터를 사용합니다
    const data = {};
    
    // 차트 인스턴스 저장 변수
    let hourlyUsageChart = null;
    let dayUsageChart = null;
    
    // 그래프용 색상 - 연두색 팔레트 (원래 자동차 코드에서 가져옴)
    const colors = {
        primary: 'rgba(76, 175, 80, 0.8)',
        primaryLight: 'rgba(129, 199, 132, 0.8)',
        primaryLighter: 'rgba(165, 214, 167, 0.8)',
        primaryLightest: 'rgba(200, 230, 201, 0.8)',
        background: 'rgba(232, 245, 233, 0.8)',
        border: 'rgba(76, 175, 80, 1)',
        borderLight: 'rgba(129, 199, 132, 1)',
    };
    
    // 차트 리사이즈 처리
    window.addEventListener('resize', function() {
        // 사이드바가 열려있고 창 크기가 변경될 때 차트 재조정
        if (sidebar.classList.contains('active')) {
            // Chart.js의 resize 메소드를 활용하여 모든 차트 업데이트
            Chart.instances.forEach(chart => {
                chart.resize();
            });
        }
    });

    // 평균 이동 거리 추이 함수
    async function fetchMonthlyAvgDistance() {
        const response = await fetch("/api/tashu/monthly-avg-distance");
        const result = await response.json();
        
		return result.map(item => ({
			month: parseInt(item.MONTH) + '월',
			distance: parseFloat(item.AVG_DISTANCE)
		}));
	}
	// 평균 이용 시간 추이 함수
	async function fetchMonthlyAvgTime() {
		const response = await fetch("/api/tashu/monthly-avg-time");
		const result = await response.json();
		
		return result.map(item => ({
			month: item.YEAR_MONTH,
			minutes: parseFloat(item.AVG_DURATION)
		}));
	}

	// 구별 자전거 사용량 함수
	async function fetchDistrictUsage() {
	    const response = await fetch("/api/tashu/district-usage");
	    const result = await response.json();

		return result.map(item => ({
			name: item.RT_DISTRICT,
			count: parseInt(item.USAGE_COUNT)
		}));
	}

    // 시간대별 이용량 함수 - 월 정보 포함
	async function fetchTimeComponents(year = 'all', month = 'all') {
	    let url = `/api/tashu/time-components`;
	    const params = [];

	    if (year !== 'all') params.push(`year=${year}`);
	    if (month !== 'all') params.push(`month=${month}`);
	    if (params.length > 0) url += `?${params.join("&")}`;

	    const response = await fetch(url);
	    const result = await response.json();

	    return result.map(item => ({
			year: item.YEAR,
			month: item.MONTH,
	        hour: item.HOUR,
			count: item.COUNT
	    }));
	}
    
    // 시간대별 count 직접 계산 함수 - 월별 필터링 추가
	function computeHourlyCounts(hourlyData, selectedMonth = 'all') {
	    const counts = Array.from({ length: 24 }, (_, hour) => ({
	        hour,
	        count: 0
	    }));

	    const targetMonth = selectedMonth === 'all' ? 'all' : parseInt(selectedMonth);

	    hourlyData.forEach(item => {
	        if (targetMonth !== 'all' && item.month !== targetMonth) {
	            return;
	        }

	        const hour = item.hour;
	        if (hour >= 0 && hour < 24) {
	            counts[hour].count += item.count ?? 1;
	        }
	    });

	    return counts;
	}
    // 요일별 이용량 함수 - 월 정보 포함
	async function fetchDayComponents(year = 'all', month = 'all') {
	    let url = "/api/tashu/day-components";
	    const params = [];

	    if (year !== 'all') params.push(`year=${year}`);
	    if (month !== 'all') params.push(`month=${month}`);
	    if (params.length > 0) url += `?${params.join("&")}`;

	    const response = await fetch(url);
	    const result = await response.json();

	    return result.map(item => ({
			year: item.YEAR,
			month: item.MONTH,
			dayofweek: item.DAY_OF_WEEK,
			count: item.COUNT
	    }));
	}
    
    // 요일별 count 직접 계산 함수 - 월별 필터링 추가
    function computeDayOfWeekCounts(data, selectedMonth = 'all') {
		if (!Array.isArray(data)) {
		    return [];
		}
			
        const counts = {};
        
        data.forEach(item => {
            // 선택된 월이 'all'이 아니면 선택된 월의 데이터만 필터링
            if (selectedMonth !== 'all' && item.month != selectedMonth) {
                return;
            }
            
            const day = item.dayofweek;
            if (!counts[day]) counts[day] = 0;
            counts[day] += item.count;
        });
        
        // 객체를 배열로 변환하고, 요일 순서대로 정렬
        return Object.entries(counts).map(([day, count]) => ({
            day: parseInt(day),
            count
        })).sort((a, b) => a.day - b.day);
    }
    
    // 요일명을 숫자(day) -> 한글 문자열로 변환하는 함수
    function getDayLabel(day) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return days[day] || day;
    }
    
    // 데이터 로딩 함수
    async function loadData() {
        try {
            // 평균 이동 거리 추이
            const avgDistanceData = await fetchMonthlyAvgDistance();
            data.avgDistance = avgDistanceData;
            renderAvgDistanceChart();
            
            // 평균 이용 시간 추이
            const avgTimeData = await fetchMonthlyAvgTime();
            data.avgTime = avgTimeData;
            renderAvgTimeChart();
            
            // 구별 자전거 사용량
            const usageData = await fetchDistrictUsage();
            data.districtUsage = usageData;
            renderDistrictUsageChart();
            
            // 시간대별 이용량 - 원시 데이터 저장
			const timeData = await fetchTimeComponents(2023, 'all');
			data.hourlyRawData = timeData; // 원시 데이터 저장
			const hourlyCountData = computeHourlyCounts(timeData, 'all');
			data.hourlyUsage = hourlyCountData;
			renderHourlyUsageChart('all');
            
            // 요일별 이용량 - 원시 데이터 저장
            const dayData = await fetchDayComponents();
            data.dayRawData = dayData; // 원시 데이터 저장
            const dayOfWeekCountData = computeDayOfWeekCounts(dayData, 'all');
            data.dayUsage = dayOfWeekCountData;
            renderDayUsageChart('all');
            
        } catch(e) {
            console.error('데이터 로딩 실패', e);
        }
    }
    
    // 평균 이동 거리 추이 차트
    function renderAvgDistanceChart() {
        const ctx = document.getElementById('avg-distance-chart').getContext('2d');
       
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.avgDistance.map(item => item.month),
                datasets: [{
                    label: '평균 이동 거리 (km)',
                    data: data.avgDistance.map(item => item.distance),
                    fill: true,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: colors.border,
                    tension: 0.4,
                    pointBackgroundColor: colors.border,
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
                        borderColor: colors.borderLight,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} km`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            },
                            color: '#666'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                }
            }
        });
    }
   
    // 평균 이용 시간 추이 차트
    function renderAvgTimeChart() {
        const ctx = document.getElementById('avg-time-chart').getContext('2d');
       
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.avgTime.map(item => item.month),
                datasets: [{
                    label: '평균 이용 시간 (분)',
                    data: data.avgTime.map(item => item.minutes),
                    fill: false,
                    borderColor: colors.border,
                    tension: 0.3,
                    pointBackgroundColor: colors.border,
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
                        borderColor: colors.borderLight,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} 분`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            },
                            color: '#666'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                }
            }
        });
    }
   
    // 구별 자전거 이용량 차트
    function renderDistrictUsageChart() {
        const ctx = document.getElementById('district-usage-chart').getContext('2d');
       
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.districtUsage.map(item => item.name),
                datasets: [{
                    label: '이용량',
                    data: data.districtUsage.map(item => item.count),
                    backgroundColor: colors.primary,
                    borderColor: colors.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: colors.borderLight,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} 건`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                }
            }
        });
    }
   
    // 시간대별 이용량 차트 - 월별 필터링 추가
    function renderHourlyUsageChart(selectedMonth = 'all') {
        const ctx = document.getElementById('hourly-usage-chart').getContext('2d');
        // 선택된 월에 따라 데이터 필터링
        const filteredData = computeHourlyCounts(data.hourlyRawData, selectedMonth);
        
	
        // 이미 차트가 존재하면 파괴
        if (hourlyUsageChart) {
            hourlyUsageChart.destroy();
        }
        
        hourlyUsageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredData.map(item => item.hour),
                datasets: [{
                    label: '시간대별 이용량',
                    data: filteredData.map(item => item.count),
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.borderLight,
                    borderWidth: 1,
                    borderRadius: 4
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
                        borderColor: colors.borderLight,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} 건`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
							stepSize: 1,
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }
    
    // 요일별 이용량 차트 - 월별 필터링 추가
    function renderDayUsageChart(selectedMonth = 'all') {
        const ctx = document.getElementById('day-usage-chart').getContext('2d');
        
        // 선택된 월에 따라 데이터 필터링
        const filteredData = computeDayOfWeekCounts(data.dayRawData, selectedMonth);
        
        // 이미 차트가 존재하면 파괴
        if (dayUsageChart) {
            dayUsageChart.destroy();
        }
        
        dayUsageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredData.map(item => getDayLabel(item.day)),
                datasets: [{
                    label: '요일별 이용량',
                    data: filteredData.map(item => item.count),
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1,
                    borderRadius: 4
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
                        borderColor: 'rgba(76, 175, 80, 0.7)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} 건`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                }
            }
        });
    }
    
    // 이벤트 리스너 설정 함수
    function setupEventListeners() {
        // 시간대별 이용량 월 선택 이벤트
        const hourlyMonthSelector = document.getElementById('hourly-month-selector');
        if (hourlyMonthSelector) {
            hourlyMonthSelector.addEventListener('change', function() {
                const selectedMonth = this.value;
                renderHourlyUsageChart(selectedMonth);
            });
        }
        
        // 요일별 이용량 월 선택 이벤트
        const dayMonthSelector = document.getElementById('day-month-selector');
        if (dayMonthSelector) {
            dayMonthSelector.addEventListener('change', function() {
                const selectedMonth = this.value;
                renderDayUsageChart(selectedMonth);
            });
        }
    }
    
    // 데이터 로드 및 차트 렌더링 시작
    loadData();
    
    // 이벤트 리스너 설정
    setupEventListeners();
	
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
        
        // 현재 확률 업데이트 (실제로는 서버에서 받아오겠지만, 여기서는 시간에 따라 샘플 데이터 생성)
    }
    
    // 초기 로드 및 1분마다 갱신
    updateDateTime();
    setInterval(updateDateTime, 60000);

});