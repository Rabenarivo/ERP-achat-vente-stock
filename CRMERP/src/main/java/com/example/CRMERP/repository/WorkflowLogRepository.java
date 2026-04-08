package com.example.CRMERP.repository;

import com.example.CRMERP.entity.WorkflowLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface WorkflowLogRepository extends JpaRepository<WorkflowLog, Long> {
    
}
