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
    
    // 현재 확률 업데이트
    async function updateCurrentProbability(currentHour) {
		try {
		   const response = await fetch(`/api/tashu/current-probability?hour=${currentHour}`);
		   if (!response.ok) throw new Error('서버 응답 오류');

		   const data = await response.json();
		   // 예측 확률을 0~1 사이로 받는다고 가정
		   let probability = data.probability * 100;

		   let status;
		   let statusClass;

		   // 확률에 따라 상태 분류 (예시)
		   if (probability < 40) {
		       status = "대여 가능성 낮음";
		       statusClass = "low";
		   } else if (probability < 70) {
		       status = "대여 가능성 보통";
		       statusClass = "medium";
		   } else {
		       status = "대여 가능성 높음";
		       statusClass = "high";
		   }

		   // UI 업데이트
		   const probabilityElement = document.getElementById('current-probability');
		   const statusElement = document.querySelector('.prediction-status');

		   probabilityElement.textContent = `${probability.toFixed(1)}%`;
		   statusElement.textContent = status;

		   statusElement.classList.remove('high', 'medium', 'low');
		   statusElement.classList.add(statusClass);

		   // 필요하면 영향 요인 업데이트 호출
		   updateFactors(currentHour);

	} catch (error) {
		   console.error('확률 업데이트 실패:', error);
		}
    }
    
    // 영향 요인 업데이트 (샘플 데이터)
    function updateFactors(currentHour) {
        // 시간대별 영향 요인 (샘플 데이터)
        let usersFactor;
        let weatherFactor;
        let bikesFactor;
        let dayFactor;
        
        // 요일 (0:일요일, 1:월요일, ...)
        const today = new Date().getDay();
        const isWeekend = (today === 0 || today === 6);
        
        if (currentHour >= 7 && currentHour < 9 && !isWeekend) {
            usersFactor = "매우 높음";
            bikesFactor = "낮음";
        } else if (currentHour >= 17 && currentHour < 19 && !isWeekend) {
            usersFactor = "매우 높음";
            bikesFactor = "낮음";
        } else if (currentHour >= 12 && currentHour < 14) {
            usersFactor = "높음";
            bikesFactor = "보통";
        } else if (currentHour >= 22 || currentHour < 6) {
            usersFactor = "매우 낮음";
            bikesFactor = "매우 높음";
        } else if (isWeekend && currentHour >= 10 && currentHour < 18) {
            usersFactor = "높음";
            bikesFactor = "보통";
        } else {
            usersFactor = "보통";
            bikesFactor = "높음";
        }
        
        // 날씨 (여기서는 랜덤으로 설정)
        const weatherOptions = ["맑음", "구름 조금", "구름 많음", "비", "눈"];
        const weatherProbs = [0.5, 0.25, 0.15, 0.07, 0.03]; // 확률 가중치
        
        // 가중치 기반 랜덤 선택
        let rand = Math.random();
        let cumulativeProb = 0;
        weatherFactor = weatherOptions[weatherOptions.length - 1]; // 기본값
        
        for (let i = 0; i < weatherProbs.length; i++) {
            cumulativeProb += weatherProbs[i];
            if (rand < cumulativeProb) {
                weatherFactor = weatherOptions[i];
                break;
            }
        }
        
        // 요일 인기도
        const dayPopularity = ["낮음", "보통", "보통", "보통", "높음", "매우 높음", "높음"];
        dayFactor = dayPopularity[today];
        
        // UI 업데이트
        document.getElementById('users-factor').textContent = usersFactor;
        document.getElementById('weather-factor').textContent = weatherFactor;
        document.getElementById('bikes-factor').textContent = bikesFactor;
        document.getElementById('day-factor').textContent = dayFactor;
    }
    
    // 시간대별 대여 가능 확률 차트
	function renderAvailabilityTrendChart() {
		const canvas = document.getElementById('availability-trend-chart');
		const ctx = canvas.getContext('2d');

		// 부모 컨테이너 크기에 맞춰 캔버스 실제 크기 지정
		canvas.width = canvas.clientWidth * window.devicePixelRatio;
		canvas.height = canvas.clientHeight * window.devicePixelRatio;
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	    
	    fetch("/api/tashu/hourly-probabilities")
	        .then(res => res.json())
	        .then(data => {
	            // data가 숫자 배열이므로 hours 배열 생성
	            const hours = [...Array(24).keys()].map(h => (h < 10 ? `0${h}:00` : `${h}:00`));

	            // data는 이미 % 확률 숫자 배열이므로 그대로 사용
	            const probabilities = data;

	            new Chart(ctx, {
	                type: 'line',
	                data: {
	                    labels: hours,
	                    datasets: [{
	                        label: '자전거 대여 확률 (%)',
	                        data: probabilities,
	                        fill: false,
	                        borderColor: 'rgb(75, 192, 192)',
	                        tension: 0.3,
	                        pointHoverRadius: 7,
	                        pointRadius: 5
	                    }]
	                },
	                options: {
	                    responsive: true,
	                    plugins: {
	                        legend: { display: true },
	                        tooltip: {
	                            callbacks: {
									label: function(context) {
									          const label = context.chart.data.labels[context.dataIndex];
									          const value = context.parsed.y.toFixed(1);
									          return `${label} : ${value}%`;
									        }
	                            }
	                        }
	                    },
	                    scales: {
	                        y: { beginAtZero: true, max: 100 }
	                    }
	                }
	            });
	        })
	        .catch(err => {
	            console.error('데이터 로드 오류:', err);
	        });
	}
    
    // 예측 버튼 이벤트 리스너
    const predictButton = document.getElementById('predict-button');
    predictButton.addEventListener('click', function() {
        // 사용자 입력 값 가져오기
        const dateInput = document.getElementById('prediction-date').value;
        const timeInput = document.getElementById('prediction-time').value;
        const locationSelect = document.getElementById('location-select').value;
        
        // 입력값 검증
        if (!dateInput || !timeInput) {
            alert('날짜와 시간을 모두 입력해주세요.');
            return;
        }
        
        // 예측 결과 생성
        generatePredictionResult(dateInput, timeInput, locationSelect);
    });
    
    // 예측 결과 생성
	async function generatePredictionResult(dateInput, timeInput, locationSelect) {
	    const selectedDate = new Date(dateInput);
	    const [hours, minutes] = timeInput.split(':').map(Number);
	    selectedDate.setHours(hours, minutes);

	    const year = selectedDate.getFullYear();
	    const month = selectedDate.getMonth() + 1;
	    const day = selectedDate.getDate();
	    const weekday = selectedDate.getDay(); // 0: 일요일 ~ 6: 토요일
	    const formattedHours = String(hours).padStart(2, '0');
	    const formattedMinutes = String(minutes).padStart(2, '0');

	    const formattedDateTime = `${year}년 ${month}월 ${day}일 ${['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][weekday]} ${formattedHours}:${formattedMinutes}`;
	    document.getElementById('selected-datetime').textContent = formattedDateTime;

	    // Flask 서버에 POST 요청
	    try {
	        const response = await fetch('http://192.168.0.86:5000/predict', {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json'
	            },
	            body: JSON.stringify({
	                hour: hours,
	                dayofweek: weekday,
	                month: month,
	                year: year
	            })
	        });

	        const data = await response.json();
	        let probability = 1.0 - (data.probability || 0);  // 대여 "가능성" = 1 - 예측된 수요 비율
	        probability = Math.round(probability * 1000) / 10; // 소수점 1자리로 %

	        // 지역 가중치 적용 (선택사항)
	        let locationFactor = 0;
	        if (locationSelect === 'donggu') locationFactor = 2;
	        else if (locationSelect === 'junggu') locationFactor = -2;
	        else if (locationSelect === 'seogu') locationFactor = -3;
	        else if (locationSelect === 'yuseonggu') locationFactor = 3;
	        else if (locationSelect === 'daedeokgu') locationFactor = 2;

	        probability = Math.min(100, Math.max(0, probability + locationFactor));

	        // 상태 결정
	        let status, statusClass, suggestion;
	        if (probability >= 75) {
	            status = "대여 가능성 높음";
	            statusClass = "high";
	            suggestion = "이 시간대에는 자전거 대여가 원활할 것으로 보입니다.";
	        } else if (probability >= 50) {
	            status = "대여 가능성 보통";
	            statusClass = "medium";
	            suggestion = "자전거 수요가 중간 수준입니다. 위치에 따라 여유가 다를 수 있습니다.";
	        } else {
	            status = "대여 가능성 낮음";
	            statusClass = "low";
	            suggestion = "이 시간대는 자전거 수요가 높을 수 있습니다. 여유 있는 시간대를 고려해보세요.";
	        }

	        // UI 업데이트
	        const resultProbability = document.getElementById('result-probability');
	        resultProbability.textContent = `${probability.toFixed(1)}%`;
	        resultProbability.style.color = probability >= 75 ? '#4CAF50' : (probability >= 50 ? '#FF9800' : '#F44336');

	        const resultStatus = document.getElementById('result-status');
	        resultStatus.textContent = status;
	        resultStatus.className = 'result-status';
	        resultStatus.classList.add(statusClass);

	        document.getElementById('suggestion-content').textContent = suggestion;

	    } catch (error) {
	        console.error('예측 요청 실패:', error);
	        alert("서버와의 통신에 실패했습니다. Flask 서버가 실행 중인지 확인해주세요.");
	    }
	}

    
    // 날짜 입력 필드 기본값 설정 (오늘 날짜)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('prediction-date').value = `${year}-${month}-${day}`;
    
    // 시간 입력 필드 기본값 설정 (현재 시간)
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    document.getElementById('prediction-time').value = `${hours}:${minutes}`;
    
	// 날짜 또는 시간 변경 시 유효성 검사
	document.getElementById('prediction-date').addEventListener('change', validateDateTime);
	document.getElementById('prediction-time').addEventListener('change', validateDateTime);
	// 타슈 alert 추가부분
	function validateDateTime() {
		const dateValue = document.getElementById('prediction-date').value;
	    const timeValue = document.getElementById('prediction-time').value;

	    if (!dateValue || !timeValue) return;

	    const selectedDate = new Date(dateValue);
	    const selectedMonth = selectedDate.getMonth() + 1; // 1월: 0, 2월: 1, ...
	    const selectedHour = parseInt(timeValue.split(':')[0], 10);

	    const isOffSeason = (selectedMonth === 12 || selectedMonth === 1 || selectedMonth === 2);

	    if (isOffSeason && (selectedHour < 5 || selectedHour >= 24)) {
	        alert("12~2월 비성수기에는 05시부터 24시까지만 예측이 가능합니다.");
	        // 잘못된 입력을 현재 날짜 시간으로 되돌리기
			document.getElementById('prediction-date').value = `${year}-${month}-${day}`;
	        document.getElementById('prediction-time').value = `${hours}:${minutes}`;
	    }
	}
	
    // 차트 렌더링
    renderAvailabilityTrendChart();
});