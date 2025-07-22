package com.eco.team.ev.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.eco.team.ev.vo.EvVO;

@Mapper
public interface IEvDAO {

    // 전국 누적 CO2 배출량 조회
    int getTotalNationalEmission();

    // 대전 누적 CO2 배출량 조회
    int getTotalEmissionByDaejeon();

    // 대전 전기 차량 수
    int getTotalEVBy2021();
   // 대전 전기 충전소 
    int getEV();
    // 차종별 대기오염
    List<Map<String, Integer>> getTotalByCar();
    // 전국 연도별 CO2 배출량
    List<Map<String, Object>> getNationalYearlyEmissions();

    // carModels 휘발유 차량 모델 리스트 조회
    List<String> getGasolineModels();

    // carModels 휘발유 차량 상세 정보 조회
    EvVO getCarInfoByModel(String model);
    
    //전기차 연도별 조회
    List<Map<String, Object>> getYearEV();
    
    // 전기차 충전소 시군구 별 
    List<Map<String, Object>> getcharge();
    //지도 데이터 뽑기 위한
    List<Map<String, Object>> selectinfo();
    
}
