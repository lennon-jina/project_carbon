package com.eco.team.ev.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.eco.team.ev.service.EvService;
import com.eco.team.ev.vo.EvVO;

@Controller
public class EvController {

    @Autowired
    private EvService evService;

    // 1. 전체/대전 CO2 배출량 및 연도별 그래프 데이터 제공 (chartCar.jsp)
    @GetMapping("/chart")
    public String chartCar(Model model) {
        int totalEmission = evService.getTotalNationalEmission();
        int daejeonEmission = evService.getTotalEmissionByDaejeon();
        List<Map<String, Object>> yearlyData = evService.getNationalYearlyEmissions();
        int totalEV2021 = evService.getTotalEVBy2021(); 
        int totalEV =evService.getEV();
        List<Map<String, Object>> yearlyEVList = evService.getYearEV();
        List<Map<String, Object>> getevcharge = evService.getcharge();
        Map<String, Integer> totalEmissionByCar = evService.getTotalByCar().get(0);   
        List<Map<String, Object>> info = evService.selectinfo();

        // 콘솔 출력
        System.out.println("📌 totalEV2021 from DB: " + totalEV2021);
        System.out.println("📌 info from DB: " + info );

        model.addAttribute("totalEmission", totalEmission);
        model.addAttribute("daejeonEmission", daejeonEmission);
        model.addAttribute("yearlyData", yearlyData);
        model.addAttribute("totalEV2021", totalEV2021); 
        model.addAttribute("totalEV", totalEV);
        model.addAttribute("yearlyEV",yearlyEVList);
        model.addAttribute("totalEmissionByCar", totalEmissionByCar);
        model.addAttribute("gucharge", getevcharge);
        model.addAttribute("info", info);

        return "ev/chartCar";
    }

    // carModels. 휘발유 차량 모델 리스트 보여주기 (search.jsp)
    @GetMapping("/carModels")
    public String showCarModels(Model model) {
        List<String> modelList = evService.getGasolineModels();
        model.addAttribute("modelList", modelList);
        return "ev/search";  // 예: /WEB-INF/views/ev/search.jsp
    }

    // carModels. 차량 모델 정보 상세 조회 (JSON으로 반환)
    @GetMapping("/car/info")
    @ResponseBody
    public ResponseEntity<EvVO> getCarInfo(@RequestParam("model") String model) {
        EvVO info = evService.getCarInfoByModel(model);  // 이미 단위 붙여서 리턴됨
        if (info != null) {
            return ResponseEntity.ok(info);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // --- NEW ENDPOINT: 전기차 변환 효과 계산 결과 반환 ---
    // 프론트엔드에서 특정 전기차 모델을 선택하고 "계산" 버튼을 눌렀을 때 호출될 엔드포인트
    @GetMapping("/ev/calculateConversion")
    @ResponseBody
    public Map<String, Object> calculateEvConversion(
            @RequestParam("electricCarModel") String electricCarModel,
            @RequestParam("fuelPrice") double fuelPrice, // This must be here
            @RequestParam("originalCarModel") String originalCarModel) { // This must be here
        try {
            return evService.calculateEvConversionEffect(electricCarModel, originalCarModel, fuelPrice); // Pass all three
        } catch (IllegalArgumentException e) {
            System.err.println("Calculation error: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            // You might want to return 400 Bad Request or similar HTTP status
            return errorResponse;
        } catch (Exception e) {
            System.err.println("An unexpected error occurred during calculation: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "서버 오류 발생: " + e.getMessage());
            return errorResponse;
        }
    }
}

