package com.eco.team.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests()
                .anyRequest().permitAll() // 모든 경로 인증 없이 허용
            .and()
            .csrf().disable(); // POST 테스트할 거면 CSRF 꺼줘

        return http.build();
    }
}


