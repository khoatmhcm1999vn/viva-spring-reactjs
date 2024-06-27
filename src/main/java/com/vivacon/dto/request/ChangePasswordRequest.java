package com.vivacon.dto.request;

import com.vivacon.common.validation.MatchingFields;
import com.vivacon.common.validation.Password;

import javax.validation.constraints.NotEmpty;

@MatchingFields.List({
        @MatchingFields(firstField = "NewPassword", secondField = "MatchingNewPassword", message = "The matching password is not correct !")
})
public class ChangePasswordRequest {

    @Password
    private String oldPassword;

    @Password
    private String newPassword;

    @NotEmpty
    private String matchingNewPassword;

    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
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
