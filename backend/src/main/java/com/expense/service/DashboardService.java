package com.expense.service;

import com.expense.dto.BudgetDTO;
import com.expense.dto.DashboardStatsDTO;
import com.expense.exception.ResourceNotFoundException;
import com.expense.model.User;
import com.expense.repository.BudgetRepository;
import com.expense.repository.ExpenseRepository;
import com.expense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final BudgetService budgetService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public DashboardStatsDTO getStats() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();
        int lastMonth = month == 1 ? 12 : month - 1;
        int lastYear = month == 1 ? year - 1 : year;

        BigDecimal totalThisMonth = expenseRepository.findTotalByMonth(user.getId(), month, year);
        BigDecimal totalLastMonth = expenseRepository.findTotalByMonth(user.getId(), lastMonth, lastYear);
        long totalTransactions = expenseRepository.countByUserId(user.getId());

        // Category wise expenses for current month
        List<Object[]> catData = expenseRepository.findCategoryWiseTotalByMonth(user.getId(), month, year);
        Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
        catData.forEach(row -> categoryMap.put((String) row[0], (BigDecimal) row[1]));

        // Monthly trend (last 6 months)
        LocalDate sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1);
        List<Object[]> trendData = expenseRepository.findMonthlyTrend(user.getId(), sixMonthsAgo);
        List<DashboardStatsDTO.MonthlyExpense> trend = trendData.stream().map(row -> {
            int m = ((Number) row[0]).intValue();
            int y = ((Number) row[1]).intValue();
            BigDecimal amt = (BigDecimal) row[2];
            String label = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + y;
            return DashboardStatsDTO.MonthlyExpense.builder().month(label).amount(amt).build();
        }).collect(Collectors.toList());

        // Budget totals and alerts (budgets >= 80% used)
        List<BudgetDTO> budgets = budgetService.getBudgets(month, year);
        BigDecimal totalBudget = budgets.stream()
                .map(BudgetDTO::getLimitAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BudgetDTO> alerts = budgets.stream()
                .filter(b -> b.getPercentage() >= 80)
                .collect(Collectors.toList());

        return DashboardStatsDTO.builder()
                .totalExpensesThisMonth(totalThisMonth != null ? totalThisMonth : BigDecimal.ZERO)
                .totalExpensesLastMonth(totalLastMonth != null ? totalLastMonth : BigDecimal.ZERO)
                .totalBudget(totalBudget)
                .totalTransactions(totalTransactions)
                .categoryWiseExpenses(categoryMap)
                .monthlyTrend(trend)
                .budgetAlerts(alerts)
                .build();
    }
}
