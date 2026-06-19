package com.expense.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetDTO {
    private Long id;
    private String category;
    private BigDecimal limitAmount;
    private int month;
    private int year;
    private BigDecimal spentAmount;
    private double percentage;
}
