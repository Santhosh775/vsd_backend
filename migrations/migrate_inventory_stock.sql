-- Step 1: Add new columns
ALTER TABLE inventory_stocks ADD COLUMN items JSON;
ALTER TABLE inventory_stocks ADD COLUMN new_total DECIMAL(10, 2);

-- Step 2: Migrate existing data
UPDATE inventory_stocks 
SET items = JSON_ARRAY(
    JSON_OBJECT(
        'item_name', item_name,
        'hsn_code', hsn_code,
        'quantity', quantity,
        'price_per_unit', price_per_unit,
        'gst_percentage', gst_percentage,
        'total_with_gst', total_with_gst,
        'inventory_id', inventory_id
    )
),
new_total = total_with_gst
WHERE items IS NULL;

-- Step 3: Drop old columns
ALTER TABLE inventory_stocks DROP COLUMN item_name;
ALTER TABLE inventory_stocks DROP COLUMN hsn_code;
ALTER TABLE inventory_stocks DROP COLUMN quantity;
ALTER TABLE inventory_stocks DROP COLUMN price_per_unit;
ALTER TABLE inventory_stocks DROP COLUMN gst_percentage;
ALTER TABLE inventory_stocks DROP COLUMN inventory_id;

-- Step 4: Rename new_total to total_with_gst
ALTER TABLE inventory_stocks CHANGE COLUMN new_total total_with_gst DECIMAL(10, 2) NOT NULL;

-- Step 5: Make items NOT NULL
ALTER TABLE inventory_stocks MODIFY items JSON NOT NULL;
