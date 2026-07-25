package com.banfico.hackathon.dto;

public class LoginResponse {
    private boolean success;
    private String sessionToken;
    private String message;

    public LoginResponse(boolean success, String sessionToken, String message) {
        this.success = success;
        this.sessionToken = sessionToken;
        this.message = message;
    }

    public boolean isSuccess() { return success; }
    public String getSessionToken() { return sessionToken; }
    public String getMessage() { return message; }
}
