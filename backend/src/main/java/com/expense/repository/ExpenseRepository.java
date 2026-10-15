package com.expense.repository;

import com.expense.model.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Page<Expense> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    List<Expense> findByUserIdAndCategoryOrderByDateDesc(Long userId, String category);

    List<Expense> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.user.id = :userId AND MONTH(e.date) = :month AND YEAR(e.date) = :year GROUP BY e.category")
    List<Object[]> findCategoryWiseTotalByMonth(@Param("userId") Long userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.id = :userId AND MONTH(e.date) = :month AND YEAR(e.date) = :year")
    BigDecimal findTotalByMonth(@Param("userId") Long userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.id = :userId AND e.category = :category AND MONTH(e.date) = :month AND YEAR(e.date) = :year")
    BigDecimal findTotalByCategoryAndMonth(@Param("userId") Long userId, @Param("category") String category, @Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT MONTH(e.date), YEAR(e.date), SUM(e.amount) FROM Expense e WHERE e.user.id = :userId AND e.date >= :fromDate GROUP BY YEAR(e.date), MONTH(e.date) ORDER BY YEAR(e.date), MONTH(e.date)")
    List<Object[]> findMonthlyTrend(@Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);

    Page<Expense> findByUserIdAndCategoryOrderByDateDesc(Long userId, String category, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId " +
           "AND (:category IS NULL OR :category = '' OR e.category = :category) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY e.date DESC")
    Page<Expense> searchExpenses(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("search") String search,
            Pageable pageable);
}
