package com.eco.team.tashu.vo;

import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
public class TashuVO {
	
	private int hour;           // 시간
    private int dayOfWeek;      // 요일 (0: 일요일 ~ 6: 토요일)
    private int month;          // 월
    private int year;           // 연도
    private String district;    // 대여 구
    private String dong;        // 대여 동
    
    public TashuVO() {}

    public TashuVO(int hour, int dayOfWeek, int month, int year, String district, String dong) {
        this.hour = hour;
        this.dayOfWeek = dayOfWeek;
        this.month = month;
        this.year = year;
        this.district = district;
        this.dong = dong;
    }
    
 // Getters
    public int getHour() {
        return hour;
    }

    public int getDayOfWeek() {
        return dayOfWeek;
    }

    public int getMonth() {
        return month;
    }

    public int getYear() {
        return year;
    }

    public String getDistrict() {
        return district;
    }

    public String getDong() {
        return dong;
    }

    // Setters
    public void setHour(int hour) {
        this.hour = hour;
    }

    public void setDayOfWeek(int dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public void setDong(String dong) {
        this.dong = dong;
    }
}
