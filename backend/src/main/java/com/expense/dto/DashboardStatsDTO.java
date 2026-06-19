package com.expense.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsDTO {
    private BigDecimal totalExpensesThisMonth;
    private BigDecimal totalExpensesLastMonth;
    private BigDecimal totalBudget;
    private long totalTransactions;
    private Map<String, BigDecimal> categoryWiseExpenses;
    private List<MonthlyExpense> monthlyTrend;
    private List<BudgetDTO> budgetAlerts;

    @Data
    @Builder
    public static class MonthlyExpense {
        private String month;
        private BigDecimal amount;
    }
}
