package com.eco.team.tashu.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.eco.team.tashu.vo.TashuVO;

@Service
public class TashuService { 
	
	@Autowired
	private JdbcTemplate jdbcTemplate;
	
	// 평균 이동 거리 추이
	public List<Map<String, Object>> getMonthlyAvgDistance() {
		String sql = 
			"""
				SELECT substr(rt_date,6,2) AS month, AVG(distance) AS avg_distance
				FROM tashu
				WHERE rt_date BETWEEN '2023-01-01' AND '2023-12-31 23:59:59'
				AND distance IS NOT NULL
				GROUP BY substr(rt_date,6,2)
				ORDER BY month
	        """;
		
		return jdbcTemplate.queryForList(sql);
	}
	// 평균 이용 시간 추이
	public List<Map<String, Object>> getMonthlyAvgTime() {
		String sql = 
			"""
	            SELECT substr(rt_date,1,7) AS year_month,
				ROUND(AVG(duration_m), 2) AS avg_duration
				FROM tashu
				WHERE rt_date BETWEEN '2023-01-01' AND '2023-12-31 23:59:59'
				AND duration_m IS NOT NULL
				AND duration_m BETWEEN 1 AND 200
				GROUP BY substr(rt_date,1,7)
				ORDER BY 1
	        """;

	        return jdbcTemplate.queryForList(sql);
	}
	// 구별 자전거 사용량
	public List<Map<String, Object>> getDistrictUsageStats() {
		String sql = 
			"""
	            SELECT rt_district, COUNT(*) AS usage_count
				FROM tashu
				GROUP BY rt_district
				ORDER BY usage_count DESC
	        """;

	        return jdbcTemplate.queryForList(sql);
	}
	// 시간대별 이용량
	public List<Map<String, Object>> getTimeComponents(Integer year, Integer month) {
        StringBuilder sql = new StringBuilder("""
            SELECT year, month, hour, count
            FROM tashu_time_summary
            WHERE 1 = 1
        """);

        List<Object> params = new ArrayList<>();

        if (year != null) {
            sql.append(" AND year = ? ");
            params.add(year);
        }
        if (month != null) {
            sql.append(" AND month = ? ");
            params.add(month);
        }

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return results;
    }
	// 요일별 이용량
	public List<Map<String, Object>> getDayComponents(Integer year, Integer month) {
	    StringBuilder sql = new StringBuilder("""
	        SELECT year, month, day_of_week, count
	        FROM tashu_dayofweek_summary
	        WHERE 1=1
	    """);

	    List<Object> params = new ArrayList<>();

	    if (year != null) {
	        sql.append(" AND year = ? ");
	        params.add(year);
	    }
	    if (month != null) {
	        sql.append(" AND month = ? ");
	        params.add(month);
	    }

	    sql.append(" ORDER BY year, month, day_of_week ");

	    List<Map<String, Object>> results = jdbcTemplate.queryForList(sql.toString(), params.toArray());
	    return results;
	}
	// 현재 자전거 대여 가능 확률
	public List<Map<String, Object>> getRentalHistory() {
	    String sql = """
	        SELECT 
	            rt_date, 
	            rt_district, 
	            rt_dong 
	        FROM tashu 
	        WHERE rt_date IS NOT NULL
	    """;

	    return jdbcTemplate.queryForList(sql);
	}
	// 시간대별 0~23시 예측
	public List<Double> getHourlyProbabilities() {
	    RestTemplate restTemplate = new RestTemplate();
	    String flaskUrl = "http://192.168.0.86:5000/predict";

	    List<Double> result = new ArrayList<>();
	    LocalDateTime now = LocalDateTime.now();

	    for (int hour = 0; hour < 24; hour++) {
	        Map<String, Object> requestBody = new HashMap<>();
	        requestBody.put("hour", hour);
	        requestBody.put("dayofweek", now.getDayOfWeek().getValue() % 7);
	        requestBody.put("month", now.getMonthValue());
	        requestBody.put("year", now.getYear());

	        // 👇 응답을 Map으로 받아서 probability 추출
	        Map<String, Object> response = restTemplate.postForObject(flaskUrl, requestBody, Map.class);

	        // 👇 안전하게 변환
	        Double probability = 0.0;
	        if (response != null && response.containsKey("probability")) {
	            probability = ((Number) response.get("probability")).doubleValue();
	        } else {
	            System.out.println("❌ Flask 응답 오류: " + response);
	            probability = 0.0; // 또는 continue;
	        }

	        // 👇 소수점 1자리 반올림
	        probability = 1.0 - probability;
	        probability = Math.round(probability * 1000.0) / 10.0;
	        result.add(probability);
	    }

	    return result;
	}
	// 시간대 예측 모델
	public double getRentalProbabilityFromModel(int hour, int dayOfWeek, int month, int year) {
	    String flaskUrl = "http://192.168.0.86:5000/predict";

	    RestTemplate restTemplate = new RestTemplate();

	    Map<String, Object> request = new HashMap<>();
	    request.put("hour", hour);
	    request.put("dayofweek", dayOfWeek);
	    request.put("month", month);
	    request.put("year", year);

	    try {
	        ResponseEntity<Map> response = restTemplate.postForEntity(flaskUrl, request, Map.class);
	        Map<String, Object> body = response.getBody();

	        if (body != null && body.containsKey("probability")) {
	            return ((Number) body.get("probability")).doubleValue();
	        } else {
	            return -1.0; // 실패시 -1 반환
	        }

	    } catch (Exception e) {
	        e.printStackTrace();
	        return -1.0;
	    }
	}
	// 특정 시간, 날짜 입력 기반 예측
	public double getCurrentRentalProbability() {
	    LocalDateTime now = LocalDateTime.now();

	    int hour = now.getHour();
	    int dayOfWeek = now.getDayOfWeek().getValue() % 7;
	    int month = now.getMonthValue();
	    int year = now.getYear();

	    double rentalProb = getRentalProbabilityFromModel(hour, dayOfWeek, month, year);
	    return 1.0 - rentalProb;
	}
}
