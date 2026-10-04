package com.vivacon.security;

import com.vivacon.common.enum_type.RoleType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.core.GrantedAuthorityDefaults;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import static com.vivacon.common.constant.Constants.API_V1;
import static com.vivacon.common.constant.Constants.URL_WHITELIST;

/**
 * This class is used to configure HTTP request security approach based on Spring Security
 */
@Configuration
@EnableWebSecurity
public class HTTPSecurityConfiguration extends WebSecurityConfigurerAdapter {

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    private UserDetailServiceImpl userDetailsService;

    private JWTRequestFilter jwtRequestFilter;

    private AuthenticationEntryPointImpl authenticationEntryPointHandler;

    /**
     * Cung mot danh sach ma STOMPMessageBrokerConfiguration dung cho WebSocket.
     * Mot thuoc tinh, hai noi doc: dat sai thi ca API va socket cung bao loi, chu
     * khong phai mot cai chay mot cai chet.
     */
    private String[] allowedOrigins;

    @Autowired
    public HTTPSecurityConfiguration(UserDetailServiceImpl userDetailsService,
                                     JWTRequestFilter jwtRequestFilter,
                                     AuthenticationEntryPointImpl authenticationEntryPointHandler,
                                     @Value("${vivacon.frontend.allowed-origins:}") String[] allowedOrigins) {
        this.userDetailsService = userDetailsService;
        this.jwtRequestFilter = jwtRequestFilter;
        this.authenticationEntryPointHandler = authenticationEntryPointHandler;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    /**
     * This method is used to configure password encoder for hashing client password
     * to detect is it matching with db hashed password
     *
     * @return
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * This method is used to configure our authorities will not begin with 'ROLE_'
     *
     * @return GrantedAuthorityDefaults
     */
    @Bean
    public GrantedAuthorityDefaults grantedAuthorityDefaults() {
        return new GrantedAuthorityDefaults("");
    }

    /**
     * This method is used to configure our AuthenticationProvider which we want
     * Spring Security will use it to authenticate every requests
     *
     * @return AuthenticationProvider
     */
    @Bean
    public AuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider();
        daoAuthenticationProvider.setUserDetailsService(userDetailsService);
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder());
        daoAuthenticationProvider.setHideUserNotFoundExceptions(false);
        return daoAuthenticationProvider;
    }

    /**
     * This method is used to configure Authentication Manager in Spring Security will use our
     * DaoAuthenticationProvider bean
     *
     * @param auth
     * @throws Exception
     */
    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(daoAuthenticationProvider());
    }

    /**
     * This method is used for configure what we will expected Spring Security will handle when a HTTP request has been sent to our system
     * This is the centre configuration for the whole security system which include adding our custom filter, authorization requests purpose, turn of or on CSRF, CORS, SessionState..
     *
     * @param http HttpSecurity which is used for configuration purpose
     * @throws Exception
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        final String[] urlWhitelistArray = URL_WHITELIST.toArray(new String[0]);
        http
                .cors()
                .and()
                .csrf().disable()
                .exceptionHandling().authenticationEntryPoint(authenticationEntryPointHandler)
                .and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                .antMatchers(urlWhitelistArray).permitAll()
                .antMatchers("/actuator/**").permitAll()
                .antMatchers(API_V1 + "/admin/**").hasAnyAuthority(RoleType.SUPER_ADMIN.toString(), RoleType.ADMIN.toString())
                .antMatchers(HttpMethod.POST, API_V1 + "/account/password").permitAll()
                .antMatchers(HttpMethod.DELETE, API_V1 + "/comment/{id}").access("@resourceRestrictionService.isAccessibleToCommentResource(#id)")
                .antMatchers(HttpMethod.DELETE, API_V1 + "/post/{id}").access("@resourceRestrictionService.isAccessibleToPostResource(#id)")
                .antMatchers(API_V1 + "/conversation/{id}/messages").access("@resourceRestrictionService.isAccessibleToConversationResource(#id)")
                .anyRequest().authenticated()
                .and()
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }

    /**
     * CORS cho cac request HTTP, gioi han theo vivacon.frontend.allowed-origins.
     *
     * Truoc day o day la addAllowedOriginPattern("*") di kem setAllowCredentials(true).
     * Cap doi do co nghia la Spring PHAN CHIEU lai bat ky Origin nao gui den va kem
     * Access-Control-Allow-Credentials: true, tuc moi trang web tren Internet deu goi
     * duoc API nay bang trinh duyet cua nguoi dung va doc duoc phan hoi.
     *
     * Rieng voi he nay thi thiet hai con han che, vi token di trong header
     * Authorization lay tu cookie thuoc origin cua frontend, ma trang khac khong doc
     * duoc cookie do. Nhung no la mot cai bay dang san: ngay nao co nguoi chuyen sang
     * xac thuc bang cookie thi lo hong tro thanh that, va luc do khong ai nho o day
     * tung co dau *.
     *
     * Entry nao chua dau * duoc dang ky nhu pattern, de phuc vu preview URL cua
     * Vercel (dang https:// *.vercel.app). Con lai la so khop chinh xac.
     *
     * @return CorsFilter
     */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        if (allowedOrigins == null || allowedOrigins.length == 0) {
            // Khong tu dong mo lai thanh "*": lam vay la lang le quay ve dung cai
            // vua sua. Bao to roi de request cross-origin bi tu choi.
            logger.warn("vivacon.frontend.allowed-origins dang TRONG: moi request "
                    + "cross-origin se bi CORS tu choi. Dat FRONTEND_ALLOWED_ORIGINS "
                    + "thanh origin that cua frontend.");
        } else {
            for (String origin : allowedOrigins) {
                String trimmed = origin.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                if (trimmed.contains("*")) {
                    config.addAllowedOriginPattern(trimmed);
                } else {
                    config.addAllowedOrigin(trimmed);
                }
            }
            logger.info("CORS chap nhan origin: {}", String.join(", ", allowedOrigins));
        }

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
