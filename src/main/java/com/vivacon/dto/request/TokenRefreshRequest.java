package com.vivacon.dto.request;

import javax.validation.constraints.NotBlank;

public class TokenRefreshRequest {

    @NotBlank(message = "Refresh token is blank")
    private String refreshToken;

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
