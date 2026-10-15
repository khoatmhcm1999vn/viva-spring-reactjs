package com.vivacon.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.util.List;

@Configuration
@Profile({"dev"})
@EnableSwagger2
public class SwaggerConfiguration {

    private static final String JWT_SCHEME = "JWT";

    // Nut "Authorize" tren Swagger UI: dan "Bearer <accessToken>" lay tu POST /api/v1/login
    // thi moi request sau do tu gan header Authorization. Khong co thi moi API can dang
    // nhap goi tu Swagger deu tra 401.
    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.any())
                .paths(PathSelectors.any())
                .build()
                .securitySchemes(List.of(new ApiKey(JWT_SCHEME, "Authorization", "header")))
                .securityContexts(List.of(SecurityContext.builder()
                        .securityReferences(List.of(new SecurityReference(JWT_SCHEME,
                                new AuthorizationScope[]{new AuthorizationScope("global", "accessEverything")})))
                        .build()))
                .apiInfo(metaInfo());
    }

    private ApiInfo metaInfo() {
        return new ApiInfoBuilder()
                .title("Rest API with Swagger 2")
                .description("Vivacon Social Media Service REST API Documentation")
                .version("1.0")
                .build();
    }
}
