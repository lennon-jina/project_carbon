package com.eco.team.ev.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eco.team.ev.dao.IEvDAO;
import com.eco.team.ev.vo.EvVO;

@Service
public class EvService {

    @Autowired
    private IEvDAO evDAO;

    private static final double DRIVING_DISTANCE_YEARLY_KM = 10000.0; // 연간 주행 거리 (km)
    private static final double TREE_CO2_ABSORPTION_KG_PER_YEAR = 6.6; // 나무 한 그루가 연간 흡수하는 CO2 양 (kg) - 국제 표준 평균치로 변경
    // private static final double GASOLINE_PRICE_PER_L = 1600.0; // 휘발유 1리터 당 가격 (원) - 이제 프론트엔드에서 받음
    private static final double ELECTRICITY_PRICE_PER_KWH = 347.2; // 전기 1kWh 당 가격 (원) - 최근 평균 단가로 변경 (산업부 고시 기준)

    // IMPORTANT: Make sure this is a valid gasoline car model in your DB, used as fallback.
    private static final String DEFAULT_FALLBACK_GASOLINE_CAR_MODEL = "BMW 530i";


    // 전국 총 CO2 배출량 조회
    public int getTotalNationalEmission() {
        return evDAO.getTotalNationalEmission();
    }

    // 대전 총 CO2 배출량 조회
    public int getTotalEmissionByDaejeon() {
        return evDAO.getTotalEmissionByDaejeon();
    }
    // 대전 전기차량 수 조회
    public int getTotalEVBy2021() {
        return evDAO.getTotalEVBy2021();
    }
    // 대전 전기 충전소 개수
    public int getEV() {
        return evDAO.getEV();
    }
    // 차종별 대기오염
    public List<Map<String, Integer>> getTotalByCar() {
        return evDAO.getTotalByCar();
    }

    // 전국 연도별 CO2 배출량 조회
    public List<Map<String, Object>> getNationalYearlyEmissions() {
        return evDAO.getNationalYearlyEmissions();
    }

    // carModels 휘발유 차량 모델 리스트 조회
    public List<String> getGasolineModels() {
        return evDAO.getGasolineModels();
    }

    // carModels 특정 휘발유 차량 모델 정보 조회
    // 차량 모델 정보 조회 (efficiency 단위 포함해서 세팅)
    public EvVO getCarInfoByModel(String model) {
        EvVO car = evDAO.getCarInfoByModel(model);
        setEfficiencyByFuel(car); // 여기서 효율성 문자열을 설정
        return car;
    }
    // 연도별 늘어나는 전기차 갯수
    public List<Map<String, Object>> getYearEV() {
        return evDAO.getYearEV();
    }
    // 시군구 전기차 충전소 개수 (구마다)
    public List<Map<String, Object>> getcharge() {
        return evDAO.getcharge();
    }
    // 지도 데이터 가져오기
    public List<Map<String, Object>> selectinfo() {
        return evDAO.selectinfo();
    }

    // efficiency 필드에 단위 붙여서 세팅하는 private 메서드
    private void setEfficiencyByFuel(EvVO car) {
        if (car == null) return;

        String fuel = car.getFuel();
        if (fuel == null) {
            car.setEfficiency("-");
            return;
        }

        DecimalFormat df = new DecimalFormat("#.##"); // 소수점 둘째 자리까지
        df.setRoundingMode(RoundingMode.HALF_UP); // 반올림 처리로 변경 (일반적으로 사용되는 방식)

        try {
            if ("Gasoline".equalsIgnoreCase(fuel)) {
                if (car.getCmbKpl() != null && car.getCmbKpl().compareTo(BigDecimal.ZERO) > 0) {
                    car.setEfficiency(df.format(car.getCmbKpl().doubleValue()) + " km/L");
                    return;
                }
            } else if ("Electricity".equalsIgnoreCase(fuel)) {
                if (car.getCmgKpkWh() != null && car.getCmgKpkWh().compareTo(BigDecimal.ZERO) > 0) {
                    car.setEfficiency(df.format(car.getCmgKpkWh().doubleValue()) + " km/kWh");
                    return;
                }
            }
            car.setEfficiency("-"); // 유효한 연비 값이 없거나 0 이하인 경우
        } catch (Exception e) {
            // 예외 발생 시 (예: 숫자로 변환할 수 없는 값)
            car.setEfficiency("-");
            System.err.println("Error setting efficiency for car model: " + car.getModel() + ". Error: " + e.getMessage());
            // 로깅: logger.error("Error setting efficiency for car model: " + car.getModel(), e);
        }
    }


    // --- NEW METHOD: 전기차 변환 효과 계산 (CO2 절감, 연료비 절감, 나무 심기 효과) ---
    // 프론트엔드에서 넘어오는 fuelPrice와 originalCarModel을 파라미터로 추가
    public Map<String, Object> calculateEvConversionEffect(String electricCarModel, String originalCarModel, double fuelPrice) {
        Map<String, Object> results = new HashMap<>();

        // 1. 현재 선택된 전기차 정보 조회
        EvVO electricCarInfo = evDAO.getCarInfoByModel(electricCarModel);
        // 전기차 정보에도 효율성 문자열 설정 (null 체크 후)
        setEfficiencyByFuel(electricCarInfo);

        // 2. 비교 대상이 될 (기존) 휘발유 차량 정보 조회
        EvVO originalGasolineCarInfo = evDAO.getCarInfoByModel(originalCarModel);
        if (originalGasolineCarInfo == null) {
            System.err.println("Original gasoline car model not found: " + originalCarModel + ". Using fallback model: " + DEFAULT_FALLBACK_GASOLINE_CAR_MODEL);
            originalGasolineCarInfo = evDAO.getCarInfoByModel(DEFAULT_FALLBACK_GASOLINE_CAR_MODEL);
            // Fallback 모델마저 없으면 에러 발생
            if (originalGasolineCarInfo == null) {
                throw new IllegalArgumentException("Original or fallback gasoline car model not found.");
            }
        }
        // 휘발유차 정보에도 효율성 문자열 설정 (null 체크 후)
        setEfficiencyByFuel(originalGasolineCarInfo);


        // --- 계산에 필요한 데이터 추출 및 기본값 설정 ---
        // 전기차 CO2 배출량 (g/km)
        // 전기차는 운행 중 직접적인 CO2 배출이 없으므로 0으로 간주 (DB에 0으로 저장되어야 함)
        BigDecimal electricCombCo2PerKm = BigDecimal.ZERO; // 기본값 0으로 설정
        if (electricCarInfo.getCombCo2() != null) {
            electricCombCo2PerKm = BigDecimal.valueOf(electricCarInfo.getCombCo2());
        }

        // 휘발유차 연비 (km/L) - null 체크 및 0 방지
        BigDecimal gasolineCmbKpl = BigDecimal.ZERO;
        if (originalGasolineCarInfo.getCmbKpl() != null && originalGasolineCarInfo.getCmbKpl().compareTo(BigDecimal.ZERO) > 0) {
            gasolineCmbKpl = originalGasolineCarInfo.getCmbKpl();
        } else {
            System.err.println("Original gasoline car KPL is null or zero: " + originalCarModel);
            // 계산을 위해 아주 작은 값 설정 (0으로 나누는 것 방지)
            gasolineCmbKpl = new BigDecimal("0.001");
        }

        // 휘발유차 CO2 배출량 (g/km) - null 체크 및 0 방지
        BigDecimal gasolineCombCo2PerKm = BigDecimal.ZERO;
        if (originalGasolineCarInfo.getCombCo2() != null) {
            gasolineCombCo2PerKm = BigDecimal.valueOf(originalGasolineCarInfo.getCombCo2());
        } else {
            System.err.println("Original gasoline car CO2 is null: " + originalCarModel);
            // CO2가 없으면 절감 효과 계산이 어려우므로 0으로 간주 (또는 에러 처리)
        }

        // 전기차 연비 (km/kWh) - null 체크 및 0 방지
        BigDecimal electricCmgKpkWh = BigDecimal.ZERO;
        if (electricCarInfo.getCmgKpkWh() != null && electricCarInfo.getCmgKpkWh().compareTo(BigDecimal.ZERO) > 0) {
            electricCmgKpkWh = electricCarInfo.getCmgKpkWh();
        } else {
            System.err.println("Electric car KWH is null or zero: " + electricCarModel);
            // 계산을 위해 아주 작은 값 설정 (0으로 나누는 것 방지)
            electricCmgKpkWh = new BigDecimal("0.001");
        }


        // --- 연간 탄소 배출량 절감 (Annual CO2 Reduction) ---
        // 원본 휘발유차의 연간 CO2 배출량 (kg)
        BigDecimal originalAnnualCo2Kg = gasolineCombCo2PerKm
                                        .multiply(BigDecimal.valueOf(DRIVING_DISTANCE_YEARLY_KM))
                                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP); // g -> kg 변환


        // 전기차의 연간 CO2 배출량 (kg) - 직접 배출은 0으로 간주
        BigDecimal electricAnnualCo2Kg = electricCombCo2PerKm
                                        .multiply(BigDecimal.valueOf(DRIVING_DISTANCE_YEARLY_KM))
                                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

        BigDecimal annualCo2ReductionKg = originalAnnualCo2Kg.subtract(electricAnnualCo2Kg);
        if (annualCo2ReductionKg.compareTo(BigDecimal.ZERO) < 0) {
            annualCo2ReductionKg = BigDecimal.ZERO; // 절감액이 음수가 되지 않도록
        }


        // --- 10년간 탄소 배출량 절감 (10-Year CO2 Reduction) ---
        BigDecimal tenYearCo2ReductionKg = annualCo2ReductionKg.multiply(BigDecimal.TEN);


        // --- 나무 심기 효과 (Tree Planting Effect) ---
        int treePlantingEffect = 0;
        if (annualCo2ReductionKg.compareTo(BigDecimal.ZERO) > 0 && TREE_CO2_ABSORPTION_KG_PER_YEAR > 0) {
            treePlantingEffect = annualCo2ReductionKg.divide(
                                        BigDecimal.valueOf(TREE_CO2_ABSORPTION_KG_PER_YEAR),
                                        0, RoundingMode.DOWN // 소수점 이하 버림 (나무는 정수로)
                                    ).intValue();
        }

        // --- 연간 연료비 절감액 (Annual Fuel Cost Savings) ---
        // 휘발유차 연간 연료 소비량 (L) = 주행 거리 / 연비 (km/L)
        BigDecimal litersConsumed = BigDecimal.valueOf(DRIVING_DISTANCE_YEARLY_KM)
                                    .divide(gasolineCmbKpl, 2, RoundingMode.HALF_UP);
        // 휘발유차 연간 연료 비용 (원) = 소비량 * 유가 (프론트엔드에서 받은 값 사용)
        BigDecimal originalAnnualFuelCost = litersConsumed.multiply(BigDecimal.valueOf(fuelPrice));


        // 전기차 연간 전력 소비량 (kWh) = 주행 거리 / 연비 (km/kWh)
        BigDecimal kWhConsumed = BigDecimal.valueOf(DRIVING_DISTANCE_YEARLY_KM)
                                .divide(electricCmgKpkWh, 2, RoundingMode.HALF_UP);
        // 전기차 연간 연료 비용 (원) = 소비량 * 전기 요금
        BigDecimal electricAnnualFuelCost = kWhConsumed.multiply(BigDecimal.valueOf(ELECTRICITY_PRICE_PER_KWH));

        BigDecimal annualFuelCostSavingsKrw = originalAnnualFuelCost.subtract(electricAnnualFuelCost);
        if (annualFuelCostSavingsKrw.compareTo(BigDecimal.ZERO) < 0) {
            annualFuelCostSavingsKrw = BigDecimal.ZERO; // 절감액이 음수가 되지 않도록
        }


        // --- 결과 Map에 담기 ---
        // 원본 차량의 탄소 배출량 및 연료비 (프론트엔드의 "before" 값)
        results.put("originalAnnualCo2", originalAnnualCo2Kg.setScale(0, RoundingMode.HALF_UP).toPlainString());
        results.put("originalTenYearCo2", originalAnnualCo2Kg.multiply(BigDecimal.valueOf(10)).setScale(0, RoundingMode.HALF_UP).toPlainString());
        results.put("originalAnnualFuelCost", originalAnnualFuelCost.setScale(0, RoundingMode.HALF_UP).toPlainString());
        results.put("electricAnnualFuelCost", electricAnnualFuelCost.setScale(0, RoundingMode.HALF_UP).toPlainString());


        // 절감된 탄소 배출량, 나무 심기 효과, 연료비 절감액
        results.put("annualCo2Reduction", annualCo2ReductionKg.setScale(0, RoundingMode.HALF_UP).toPlainString());
        results.put("tenYearCo2Reduction", tenYearCo2ReductionKg.setScale(0, RoundingMode.HALF_UP).toPlainString());
        results.put("treePlantingEffect", treePlantingEffect);
        results.put("annualFuelCostSavings", annualFuelCostSavingsKrw.setScale(0, RoundingMode.HALF_UP).toPlainString());

        // 현재 (변환된) 전기차의 정보 (상단 정보 박스에 표시될 내용)
        results.put("currentCarFuel", electricCarInfo.getFuel());
        results.put("currentCarEfficiency", electricCarInfo.getEfficiency()); // 이미 setEfficiencyByFuel에서 포맷된 문자열
        results.put("currentCarCombCo2", electricCarInfo.getCombCo2()); // 전기차의 경우 0이 되어야 함

        return results;
    }
}