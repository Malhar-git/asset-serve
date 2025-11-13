package com.assetserve.monetary.test;

import com.angelbroking.smartapi.SmartConnect;
import com.angelbroking.smartapi.models.User;

public class SmartAPITest {
    public static void main(String[] args) {
        try {
            SmartConnect smartConnect = new SmartConnect();
            System.out.println("SmartAPI dependency loaded successfully!");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }}