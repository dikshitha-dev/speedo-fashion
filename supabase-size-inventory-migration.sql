-- ==============================================================================
-- SPEEDO FASHIONS: SIZE-WISE INVENTORY MANAGEMENT MIGRATION
-- Adds size_stock JSONB column, backfills existing products, and provides
-- an atomic stock deduction function to prevent overselling.
-- ==============================================================================

-- 1. Add size_stock JSONB column to public.products if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS size_stock JSONB DEFAULT '{"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0}'::jsonb;

-- 2. Backfill existing products where size_stock is NULL or empty
DO $$
DECLARE
  r RECORD;
  v_stock INT;
  v_sizes JSONB;
  v_num_sizes INT;
  v_per_size INT;
  v_rem INT;
  v_new_stock JSONB;
  v_s TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id, stock, sizes, size_stock FROM public.products LOOP
    -- Only backfill if size_stock is NULL or has no keys
    IF r.size_stock IS NULL OR r.size_stock = '{}'::jsonb OR r.size_stock = 'null'::jsonb THEN
      v_stock := COALESCE(r.stock, 10);
      v_sizes := COALESCE(r.sizes, '["S", "M", "L", "XL"]'::jsonb);
      v_num_sizes := jsonb_array_length(v_sizes);
      
      -- Start with standard 0 stock for all sizes
      v_new_stock := '{"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0}'::jsonb;
      
      IF v_num_sizes > 0 AND v_stock > 0 THEN
        v_per_size := v_stock / v_num_sizes;
        v_rem := v_stock % v_num_sizes;
        
        i := 0;
        FOR v_s IN SELECT jsonb_array_elements_text(v_sizes) LOOP
          i := i + 1;
          IF i <= v_rem THEN
            v_new_stock := jsonb_set(v_new_stock, ARRAY[v_s], to_jsonb(v_per_size + 1));
          ELSE
            v_new_stock := jsonb_set(v_new_stock, ARRAY[v_s], to_jsonb(v_per_size));
          END IF;
        END LOOP;
      ELSE
        -- Fallback if stock is 0
        FOR v_s IN SELECT jsonb_array_elements_text(v_sizes) LOOP
          v_new_stock := jsonb_set(v_new_stock, ARRAY[v_s], to_jsonb(0));
        END LOOP;
      END IF;

      -- Update the product
      UPDATE public.products
      SET size_stock = v_new_stock,
          stock = v_stock
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- 3. Atomic Stored Procedure for size-wise stock deduction during checkout
-- Prevents race conditions and overselling by locking the product row FOR UPDATE.
CREATE OR REPLACE FUNCTION public.deduct_product_size_stock(
  p_product_id TEXT,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock JSONB;
  v_size_qty INTEGER;
  v_new_size_qty INTEGER;
  v_total_stock INTEGER := 0;
  v_updated_stock JSONB;
  v_key TEXT;
  v_val TEXT;
  v_normalized_size TEXT;
BEGIN
  -- Validate inputs
  IF p_product_id IS NULL OR p_size IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Invalid product_id, size, or quantity', 
      'code', 'INVALID_INPUT'
    );
  END IF;

  v_normalized_size := UPPER(TRIM(p_size));

  -- Lock row for update
  SELECT size_stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Product with ID ' || p_product_id || ' not found', 
      'code', 'PRODUCT_NOT_FOUND'
    );
  END IF;

  -- Default empty stock structure if null
  IF v_current_stock IS NULL THEN
    v_current_stock := '{"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0}'::jsonb;
  END IF;

  -- Extract current stock for the requested size
  v_size_qty := COALESCE((v_current_stock->>v_normalized_size)::INTEGER, 0);

  -- Check if sufficient stock is available
  IF v_size_qty < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Insufficient stock for size ' || v_normalized_size || '. Available: ' || v_size_qty || ', requested: ' || p_quantity,
      'code', 'OUT_OF_STOCK',
      'size', v_normalized_size,
      'available', v_size_qty,
      'requested', p_quantity
    );
  END IF;

  -- Deduct quantity
  v_new_size_qty := v_size_qty - p_quantity;
  v_updated_stock := jsonb_set(v_current_stock, ARRAY[v_normalized_size], to_jsonb(v_new_size_qty));

  -- Recalculate total stock across all sizes
  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_updated_stock) LOOP
    v_total_stock := v_total_stock + COALESCE(v_val::INTEGER, 0);
  END LOOP;

  -- Update row with new stock and size_stock
  UPDATE public.products
  SET size_stock = v_updated_stock,
      stock = v_total_stock
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'size', v_normalized_size,
    'previous_qty', v_size_qty,
    'deducted_qty', p_quantity,
    'remaining_qty', v_new_size_qty,
    'total_stock', v_total_stock,
    'size_stock', v_updated_stock
  );
END;
$$;

-- 4. Grant execution rights to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.deduct_product_size_stock(TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
