package com.vivacon.dto.request;

import com.vivacon.common.validation.MatchingFields;
import com.vivacon.common.validation.Password;

import javax.validation.constraints.NotEmpty;

@MatchingFields.List({
        @MatchingFields(firstField = "NewPassword", secondField = "MatchingNewPassword", message = "The matching password is not correct !")
})
public class ForgotPasswordRequest {

    @NotEmpty
    private String verificationToken;

    @Password
    private String newPassword;

    @NotEmpty
    private String matchingNewPassword;

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getMatchingNewPassword() {
        return matchingNewPassword;
    }

    public void setMatchingNewPassword(String matchingNewPassword) {
        this.matchingNewPassword = matchingNewPassword;
    }
}
