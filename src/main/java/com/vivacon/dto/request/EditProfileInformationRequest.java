package com.vivacon.dto.request;

import com.vivacon.common.enum_type.Gender;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;

public class EditProfileInformationRequest {

    @NotBlank
    private String username;

    @NotEmpty
    @Email
    private String email;

    @NotBlank
    private String fullName;

    private String bio;

    private String phoneNumber;

    private Gender gender;

    public EditProfileInformationRequest() {

    }

    public EditProfileInformationRequest(String username, String email, String fullName, String bio, String phoneNumber, Gender gender) {
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.bio = bio;
        this.phoneNumber = phoneNumber;
        this.gender = gender;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }
}
