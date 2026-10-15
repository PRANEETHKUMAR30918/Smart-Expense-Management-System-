package com.expense.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetDTO {
    private Long id;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Limit amount is required")
    @Positive(message = "Limit amount must be greater than zero")
    private BigDecimal limitAmount;

    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private int month;

    @Min(value = 2000, message = "Year must be a valid year")
    private int year;

    private BigDecimal spentAmount;
    private double percentage;
}
