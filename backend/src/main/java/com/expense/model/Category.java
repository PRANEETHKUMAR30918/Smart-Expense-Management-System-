package com.expense.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Category name is required")
    @jakarta.validation.constraints.Size(min = 1, max = 50, message = "Category name must be between 1 and 50 characters")
    @Column(unique = true, nullable = false)
    private String name;

    private String icon;

    private String color;
}
