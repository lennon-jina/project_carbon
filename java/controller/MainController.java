package com.eco.team.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {
	
	@GetMapping("/")
    public String main() {
        return "main/main";
    }
    
    @GetMapping("/test")
    public String test() {
        return "test/cloud";
    }
    
    @GetMapping("/about")
    public String about() {
        return "about/about";
    }
    
    //@GetMapping("/chart")
    //public String chart() {
     //   return "ev/chartCar";
    //}
    
    @GetMapping("/car")
    public String car() {
        return "ev/search";
    }
    
    @GetMapping("/bicycle")
    public String bicycle() {
        return "tashu/chartBicycle";
    }
    
    @GetMapping("/calculator")
    public String calculator() {
        return "tashu/calculator";
    }
    
    @GetMapping("/predict")
    public String predict() {
        return "tashu/predict";
    }
}
