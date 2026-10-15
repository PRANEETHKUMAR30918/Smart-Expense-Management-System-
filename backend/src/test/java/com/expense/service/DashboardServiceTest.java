package com.expense.service;

import com.expense.dto.BudgetDTO;
import com.expense.dto.DashboardStatsDTO;
import com.expense.model.User;
import com.expense.repository.BudgetRepository;
import com.expense.repository.ExpenseRepository;
import com.expense.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private UserRepository userRepository;
    @Mock private BudgetService budgetService;

    @InjectMocks private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).name("Current").email("current@test.com").password("x").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("current@test.com", null, List.of()));
        lenient().when(userRepository.findByEmail("current@test.com")).thenReturn(Optional.of(user));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private BudgetDTO budget(String category, String limit, double percentage) {
        BudgetDTO dto = new BudgetDTO();
        dto.setCategory(category);
        dto.setLimitAmount(new BigDecimal(limit));
        dto.setPercentage(percentage);
        return dto;
    }

    @Test
    void getStats_flagsOnlyBudgetsAtOrAboveEightyPercent() {
        BudgetDTO below = budget("Food", "1000", 79.9);
        BudgetDTO atThreshold = budget("Transport", "500", 80.0);
        BudgetDTO over = budget("Shopping", "300", 120.0);
        when(budgetService.getBudgets(anyInt(), anyInt())).thenReturn(List.of(below, atThreshold, over));

        DashboardStatsDTO stats = dashboardService.getStats();

        assertThat(stats.getBudgetAlerts()).containsExactly(atThreshold, over);
    }

    @Test
    void getStats_sumsBudgetLimitsAndDefaultsMissingTotalsToZero() {
        when(budgetService.getBudgets(anyInt(), anyInt()))
                .thenReturn(List.of(budget("Food", "1000", 10.0), budget("Transport", "500", 10.0)));

        DashboardStatsDTO stats = dashboardService.getStats();

        assertThat(stats.getTotalBudget()).isEqualByComparingTo("1500");
        assertThat(stats.getTotalExpensesThisMonth()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(stats.getTotalExpensesLastMonth()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(stats.getBudgetAlerts()).isEmpty();
    }
}
