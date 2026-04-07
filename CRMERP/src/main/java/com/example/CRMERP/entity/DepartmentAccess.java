package com.example.CRMERP.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department_access")
public class DepartmentAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long departmentId;

    private Long canViewDepartmentId;
}