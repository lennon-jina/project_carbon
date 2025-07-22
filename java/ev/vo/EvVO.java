package com.eco.team.ev.vo;

import java.math.BigDecimal;

public class EvVO {
    private String model;
    private String fuel;
    private Integer airPollutionScore;     
    private BigDecimal cmbKpl;
    private BigDecimal cmgKpkWh;
    private Integer combCo2;                
    private Integer greenhouseGasScore; 
    private String efficiency;

    // Getter / Setter
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getFuel() { return fuel; }
    public void setFuel(String fuel) { this.fuel = fuel; }

    public Integer getAirPollutionScore() { return airPollutionScore; }
    public void setAirPollutionScore(Integer airPollutionScore) { this.airPollutionScore = airPollutionScore; }

    public BigDecimal getCmbKpl() { return cmbKpl; }
    public void setCmbKpl(BigDecimal cmbKpl) { this.cmbKpl = cmbKpl; }

    public BigDecimal getCmgKpkWh() { return cmgKpkWh; }
    public void setCmgKpkWh(BigDecimal cmgKpkWh) { this.cmgKpkWh = cmgKpkWh; }

    public Integer getCombCo2() { return combCo2; }
    public void setCombCo2(Integer combCo2) { this.combCo2 = combCo2; }

    public Integer getGreenhouseGasScore() { return greenhouseGasScore; }
    public void setGreenhouseGasScore(Integer greenhouseGasScore) { this.greenhouseGasScore = greenhouseGasScore; }

    public String getEfficiency() { return efficiency; }
    public void setEfficiency(String efficiency) { this.efficiency = efficiency; }
    
    @Override
    public String toString() {
        return "EvVO{" +
                "model='" + model + '\'' +
                ", fuel='" + fuel + '\'' +
                ", airPollutionScore=" + airPollutionScore +
                ", cmbKpl=" + cmbKpl +
                ", cmgKpkWh=" + cmgKpkWh +
                ", combCo2=" + combCo2 +
                ", greenhouseGasScore=" + greenhouseGasScore +
                ", efficiency='" + efficiency + '\'' +
                '}';
    }
    
    public void setEfficiencyByFuel(EvVO car) {
        if (car.getFuel() == null) {
            car.setEfficiency("-");
            return;
        }

        if ("Gasoline".equalsIgnoreCase(car.getFuel()) && car.getCmbKpl() != null) {
            car.setEfficiency(car.getCmbKpl().toPlainString() + " km/L");
        } else if ("Electricity".equalsIgnoreCase(car.getFuel()) && car.getCmgKpkWh() != null) {
            car.setEfficiency(car.getCmgKpkWh().toPlainString() + " km/kWh");
        } else {
            car.setEfficiency("-");
        }
    }

}
