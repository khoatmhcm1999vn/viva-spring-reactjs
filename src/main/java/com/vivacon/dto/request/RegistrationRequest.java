package com.vivacon.dto.request;

import com.vivacon.common.validation.MatchingFields;
import com.vivacon.common.validation.Password;
import com.vivacon.common.validation.UniqueEmail;
import com.vivacon.common.validation.Username;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;

@MatchingFields.List({
        @MatchingFields(firstField = "Password", secondField = "MatchingPassword", message = "The matching password is not correct !")
})
public class RegistrationRequest {

    @NotEmpty
    @Email
    @UniqueEmail
    private String email;

    @NotEmpty
    @Size(min = 3)
    @Username
    private String username;

    @NotEmpty
    @Size(min = 1, max = 50)
    private String fullName;

    @NotEmpty
    @Password
    private String password;

    @NotEmpty
    private String matchingPassword;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMatchingPassword() {
        return matchingPassword;
    }

    public void setMatchingPassword(String matchingPassword) {
        this.matchingPassword = matchingPassword;
    }
}
