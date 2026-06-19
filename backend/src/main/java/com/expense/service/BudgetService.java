package com.expense.service;

import com.expense.dto.BudgetDTO;
import com.expense.exception.ResourceNotFoundException;
import com.expense.model.Budget;
import com.expense.model.User;
import com.expense.repository.BudgetRepository;
import com.expense.repository.ExpenseRepository;
import com.expense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public List<BudgetDTO> getBudgets(int month, int year) {
        User user = getCurrentUser();
        return budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                .stream().map(b -> toDTO(b, user.getId())).collect(Collectors.toList());
    }

    public BudgetDTO createBudget(BudgetDTO dto) {
        User user = getCurrentUser();
        Budget budget = Budget.builder()
                .category(dto.getCategory())
                .limitAmount(dto.getLimitAmount())
                .month(dto.getMonth())
                .year(dto.getYear())
                .user(user)
                .build();
        return toDTO(budgetRepository.save(budget), user.getId());
    }

    public BudgetDTO updateBudget(Long id, BudgetDTO dto) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        if (!budget.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        budget.setCategory(dto.getCategory());
        budget.setLimitAmount(dto.getLimitAmount());
        budget.setMonth(dto.getMonth());
        budget.setYear(dto.getYear());
        return toDTO(budgetRepository.save(budget), user.getId());
    }

    public void deleteBudget(Long id) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        if (!budget.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        budgetRepository.delete(budget);
    }

    private BudgetDTO toDTO(Budget budget, Long userId) {
        BudgetDTO dto = new BudgetDTO();
        dto.setId(budget.getId());
        dto.setCategory(budget.getCategory());
        dto.setLimitAmount(budget.getLimitAmount());
        dto.setMonth(budget.getMonth());
        dto.setYear(budget.getYear());
        BigDecimal spent = expenseRepository.findTotalByCategoryAndMonth(
                userId, budget.getCategory(), budget.getMonth(), budget.getYear());
        if (spent == null) spent = BigDecimal.ZERO;
        dto.setSpentAmount(spent);
        if (budget.getLimitAmount() != null && budget.getLimitAmount().compareTo(BigDecimal.ZERO) > 0) {
            dto.setPercentage(spent.doubleValue() / budget.getLimitAmount().doubleValue() * 100);
        }
        return dto;
    }
}
