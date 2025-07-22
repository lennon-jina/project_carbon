package com.eco.team.tashu.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.eco.team.tashu.service.TashuService;

@RestController
@RequestMapping("/api/tashu")
public class TashuController { 
	
	@Autowired
	private TashuService tashuService;
	// 평균 이동 거리 추이
	@GetMapping("/monthly-avg-distance")
	public List<Map<String, Object>> getMonthlyAvgDistance() {
		return tashuService.getMonthlyAvgDistance();
	}
	// 평균 이용 시간 추이
	@GetMapping("/monthly-avg-time")
	public List<Map<String, Object>> getMonthlyAvgTime() {
		return tashuService.getMonthlyAvgTime();
	}
	// 구별 자전거 사용량
	@GetMapping("/district-usage")
    public List<Map<String, Object>> getDistrictUsage() {
        return tashuService.getDistrictUsageStats();
    }
	// 시간대별 이용량
	@GetMapping("/time-components")
	public List<Map<String, Object>> getTimeComponents(
			@RequestParam(required = false) Integer year,
			@RequestParam(required = false) Integer month) {
	    return tashuService.getTimeComponents(year, month);
	}
	// 요일별 이용량
	@GetMapping("/day-components")
    public List<Map<String, Object>> getDayCompoents(
    		@RequestParam(required = false) Integer year,
    		@RequestParam(required = false) Integer month) {
        return tashuService.getDayComponents(year, month);
    }
	// 현재 자전거 대여 가능 확률
	@GetMapping("/current-probability")
	public ResponseEntity<Map<String, Object>> getCurrentRentalProbability() {
	    double probability = tashuService.getCurrentRentalProbability();

	    Map<String, Object> response = new HashMap<>();
	    response.put("probability", probability);

	    return ResponseEntity.ok(response);
	}
	// 시간대별 대여 가능 확률
	@GetMapping("/hourly-probabilities")
	public ResponseEntity<List<Double>> getHourlyProbabilities() {
	    List<Double> result = tashuService.getHourlyProbabilities();
	    return ResponseEntity.ok(result);
	}
	// 사용자가 선택한 날짜/시간의 예측 가능 확률
	@GetMapping("/predict")
	public ResponseEntity<Map<String, Object>> getPredictedProbability(
            @RequestParam int hour,
            @RequestParam int dayOfWeek,
            @RequestParam int month,
            @RequestParam int year) {

        double probability = tashuService.getRentalProbabilityFromModel(hour, dayOfWeek, month, year);

        Map<String, Object> response = new HashMap<>();
        response.put("probability", 1.0 - probability); // 역확률 (대여 가능성)
        return ResponseEntity.ok(response);
    }

}
