package com.assetserve.monetary.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String  firstName;
    private String  email;
    private String  password;
}
