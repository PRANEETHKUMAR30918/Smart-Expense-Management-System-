package com.expense.service;

import com.expense.dto.ExpenseDTO;
import com.expense.exception.ResourceNotFoundException;
import com.expense.model.Expense;
import com.expense.model.User;
import com.expense.repository.ExpenseRepository;
import com.expense.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ExpenseService expenseService;

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

    private Expense expense(Long id, User owner) {
        return Expense.builder()
                .id(id)
                .title("Lunch")
                .amount(new BigDecimal("120.50"))
                .category("Food")
                .date(LocalDate.of(2026, 10, 5))
                .user(owner)
                .build();
    }

    private ExpenseDTO request() {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setTitle("Taxi");
        dto.setAmount(new BigDecimal("300"));
        dto.setCategory("Transport");
        dto.setDate(LocalDate.of(2026, 10, 6));
        dto.setPaymentMethod("UPI");
        return dto;
    }

    @Test
    void createExpense_savesExpenseForTheCurrentUser() {
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpenseDTO result = expenseService.createExpense(request());

        ArgumentCaptor<Expense> saved = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(saved.capture());
        assertThat(saved.getValue().getUser().getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Taxi");
        assertThat(result.getAmount()).isEqualByComparingTo("300");
        assertThat(result.getCategory()).isEqualTo("Transport");
    }

    @Test
    void updateExpense_ownExpense_updatesFields() {
        when(expenseRepository.findById(5L)).thenReturn(Optional.of(expense(5L, currentUser)));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpenseDTO result = expenseService.updateExpense(5L, request());

        assertThat(result.getTitle()).isEqualTo("Taxi");
        assertThat(result.getCategory()).isEqualTo("Transport");
    }

    @Test
    void updateExpense_otherUsersExpense_isRejectedAndNotSaved() {
        when(expenseRepository.findById(5L)).thenReturn(Optional.of(expense(5L, otherUser)));

        assertThatThrownBy(() -> expenseService.updateExpense(5L, request()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized");

        verify(expenseRepository, never()).save(any(Expense.class));
    }

    @Test
    void updateExpense_missingExpense_throwsNotFound() {
        when(expenseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.updateExpense(99L, request()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteExpense_ownExpense_isDeleted() {
        Expense own = expense(5L, currentUser);
        when(expenseRepository.findById(5L)).thenReturn(Optional.of(own));

        expenseService.deleteExpense(5L);

        verify(expenseRepository).delete(own);
    }

    @Test
    void deleteExpense_otherUsersExpense_isRejectedAndNotDeleted() {
        when(expenseRepository.findById(5L)).thenReturn(Optional.of(expense(5L, otherUser)));

        assertThatThrownBy(() -> expenseService.deleteExpense(5L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized");

        verify(expenseRepository, never()).delete(any(Expense.class));
    }

    @Test
    void getAllExpenses_returnsPageOfDtosForTheCurrentUser() {
        Page<Expense> page = new PageImpl<>(List.of(expense(1L, currentUser), expense(2L, currentUser)));
        when(expenseRepository.findByUserIdOrderByDateDesc(eq(1L), any(Pageable.class))).thenReturn(page);

        Page<ExpenseDTO> result = expenseService.getAllExpenses(0, 10);

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).extracting(ExpenseDTO::getTitle).containsOnly("Lunch");
    }

    @Test
    void getExpensesByCategory_mapsRowsForTheCurrentUser() {
        when(expenseRepository.findByUserIdAndCategoryOrderByDateDesc(1L, "Food"))
                .thenReturn(List.of(expense(1L, currentUser)));

        List<ExpenseDTO> result = expenseService.getExpensesByCategory("Food");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("Food");
    }
}
