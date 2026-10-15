package com.expense.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseDTOValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeFactory() {
        factory.close();
    }

    private ExpenseDTO validDto() {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setTitle("Lunch");
        dto.setAmount(new BigDecimal("120.50"));
        dto.setCategory("Food");
        dto.setDate(LocalDate.of(2026, 10, 5));
        return dto;
    }

    private Set<String> invalidFields(ExpenseDTO dto) {
        Set<ConstraintViolation<ExpenseDTO>> violations = validator.validate(dto);
        return violations.stream().map(v -> v.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    void validExpense_hasNoViolations() {
        assertThat(validator.validate(validDto())).isEmpty();
    }

    @Test
    void blankTitle_isRejected() {
        ExpenseDTO dto = validDto();
        dto.setTitle("  ");
        assertThat(invalidFields(dto)).containsExactly("title");
    }

    @Test
    void zeroOrNegativeAmount_isRejected() {
        ExpenseDTO zero = validDto();
        zero.setAmount(BigDecimal.ZERO);
        ExpenseDTO negative = validDto();
        negative.setAmount(new BigDecimal("-5"));

        assertThat(invalidFields(zero)).containsExactly("amount");
        assertThat(invalidFields(negative)).containsExactly("amount");
    }

    @Test
    void missingAmountCategoryAndDate_areAllRejected() {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setTitle("Lunch");

        assertThat(invalidFields(dto)).containsExactlyInAnyOrder("amount", "category", "date");
    }
}
