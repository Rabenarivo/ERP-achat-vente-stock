package com.example.CRMERP.controller;

import com.example.CRMERP.DTO.DepartmentAccessProjection;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.service.DepartmentService;
import com.example.CRMERP.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final DepartmentService departmentService;

    public UserController(UserService service, DepartmentService departmentService) {
        this.userService = service;
        this.departmentService = departmentService;
    }


    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String password = request.get("password");

        User user = userService.findByEmail(email);

        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        user.setPassword(null);

        List<DepartmentAccessProjection> access = departmentService
                .viewDepartementAcces(user.getDepartment().getId());

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("roles", user.getRoles());
        response.put("accessibleDepartments", access);

        return ResponseEntity.ok(response);
    }
}

