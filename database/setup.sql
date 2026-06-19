-- Smart Expense Manager - MySQL Setup Script
-- Run this script in MySQL before starting the backend

-- Create database
CREATE DATABASE IF NOT EXISTS expense_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE expense_db;

-- Seed default categories (optional - tables will be auto-created by JPA)
-- Run this AFTER starting the Spring Boot app for the first time (which creates the tables)

-- Default categories seed
INSERT IGNORE INTO categories (name, icon, color) VALUES
('Food', '🍔', '#10b981'),
('Transport', '🚗', '#3b82f6'),
('Shopping', '🛍️', '#ec4899'),
('Entertainment', '🎬', '#8b5cf6'),
('Health', '💊', '#ef4444'),
('Education', '📚', '#f59e0b'),
('Bills', '📄', '#06b6d4'),
('Other', '📦', '#64748b');
