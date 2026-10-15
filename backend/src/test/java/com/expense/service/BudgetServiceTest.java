package com.expense.service;

import com.expense.dto.BudgetDTO;
import com.expense.exception.ResourceNotFoundException;
import com.expense.model.Budget;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock private BudgetRepository budgetRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private BudgetService budgetService;

    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder().id(1L).name("Current").email("current@test.com").password("x").build();
        otherUser = User.builder().id(2L).name("Other").email("other@test.com").password("x").build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("current@test.com", null, List.of()));
        lenient().when(userRepository.findByEmail("current@test.com")).thenReturn(Optional.of(currentUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Budget budget(Long id, String category, String limit, User owner) {
        return Budget.builder()
                .id(id)
                .category(category)
                .limitAmount(new BigDecimal(limit))
                .month(10)
                .year(2026)
                .user(owner)
                .build();
    }

    @Test
    void getBudgets_reportsSpentAmountAndPercentage() {
        when(budgetRepository.findByUserIdAndMonthAndYear(1L, 10, 2026))
                .thenReturn(List.of(budget(1L, "Food", "1000", currentUser)));
        when(expenseRepository.findTotalByCategoryAndMonth(1L, "Food", 10, 2026))
                .thenReturn(new BigDecimal("850"));

        List<BudgetDTO> result = budgetService.getBudgets(10, 2026);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSpentAmount()).isEqualByComparingTo("850");
        assertThat(result.get(0).getPercentage()).isCloseTo(85.0, within(0.001));
    }

    @Test
    void getBudgets_withNoExpenses_reportsZeroSpentAndZeroPercent() {
        when(budgetRepository.findByUserIdAndMonthAndYear(1L, 10, 2026))
                .thenReturn(List.of(budget(1L, "Food", "1000", currentUser)));
        when(expenseRepository.findTotalByCategoryAndMonth(1L, "Food", 10, 2026)).thenReturn(null);

        BudgetDTO dto = budgetService.getBudgets(10, 2026).get(0);

        assertThat(dto.getSpentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.getPercentage()).isEqualTo(0.0);
    }

    @Test
    void getBudgets_overBudget_percentageExceedsOneHundred() {
        when(budgetRepository.findByUserIdAndMonthAndYear(1L, 10, 2026))
                .thenReturn(List.of(budget(1L, "Shopping", "1000", currentUser)));
        when(expenseRepository.findTotalByCategoryAndMonth(1L, "Shopping", 10, 2026))
                .thenReturn(new BigDecimal("1200"));

        BudgetDTO dto = budgetService.getBudgets(10, 2026).get(0);

        assertThat(dto.getPercentage()).isCloseTo(120.0, within(0.001));
    }

    @Test
    void getBudgets_withZeroLimit_doesNotDivideByZero() {
        when(budgetRepository.findByUserIdAndMonthAndYear(1L, 10, 2026))
                .thenReturn(List.of(budget(1L, "Other", "0", currentUser)));
        when(expenseRepository.findTotalByCategoryAndMonth(1L, "Other", 10, 2026))
                .thenReturn(new BigDecimal("50"));

        BudgetDTO dto = budgetService.getBudgets(10, 2026).get(0);

        assertThat(dto.getPercentage()).isEqualTo(0.0);
    }

    @Test
    void updateBudget_ownBudget_updatesFields() {
        Budget existing = budget(7L, "Food", "1000", currentUser);
        when(budgetRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> inv.getArgument(0));

        BudgetDTO request = new BudgetDTO();
        request.setCategory("Transport");
        request.setLimitAmount(new BigDecimal("500"));
        request.setMonth(11);
        request.setYear(2026);

        BudgetDTO result = budgetService.updateBudget(7L, request);

        assertThat(result.getCategory()).isEqualTo("Transport");
        assertThat(result.getLimitAmount()).isEqualByComparingTo("500");
        assertThat(result.getMonth()).isEqualTo(11);
    }

    @Test
    void updateBudget_otherUsersBudget_isRejectedAndNotSaved() {
        when(budgetRepository.findById(7L)).thenReturn(Optional.of(budget(7L, "Food", "1000", otherUser)));

        assertThatThrownBy(() -> budgetService.updateBudget(7L, new BudgetDTO()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized");

        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void deleteBudget_otherUsersBudget_isRejectedAndNotDeleted() {
        Budget foreign = budget(7L, "Food", "1000", otherUser);
        when(budgetRepository.findById(7L)).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> budgetService.deleteBudget(7L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized");

        verify(budgetRepository, never()).delete(any(Budget.class));
    }

    @Test
    void deleteBudget_ownBudget_isDeleted() {
        Budget own = budget(7L, "Food", "1000", currentUser);
        when(budgetRepository.findById(7L)).thenReturn(Optional.of(own));

        budgetService.deleteBudget(7L);

        verify(budgetRepository).delete(own);
    }

    @Test
    void deleteBudget_missingBudget_throwsNotFound() {
        when(budgetRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.deleteBudget(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
