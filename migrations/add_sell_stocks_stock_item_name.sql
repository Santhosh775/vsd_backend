-- Add stock_item_name to sell_stocks table (run once)
-- Run this against your database before using the updated API.

ALTER TABLE sell_stocks
ADD COLUMN stock_item_name VARCHAR(255) NULL
COMMENT 'Product/stock item name at time of sell';
