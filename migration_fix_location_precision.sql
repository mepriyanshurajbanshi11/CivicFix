-- CivicFix Migration: Fix Location Coordinate Precision and Address Length
-- Preserves all existing data in the issues table.

ALTER TABLE issues 
    MODIFY COLUMN latitude DECIMAL(10, 7) NOT NULL,
    MODIFY COLUMN longitude DECIMAL(11, 7) NOT NULL,
    MODIFY COLUMN address VARCHAR(500) NOT NULL;
