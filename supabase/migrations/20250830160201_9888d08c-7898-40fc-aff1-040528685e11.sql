-- Criar função para atualizar estoque de produtos
CREATE OR REPLACE FUNCTION public.update_product_stock(
  p_product_id UUID,
  p_quantity_sold INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar o estoque subtraindo a quantidade vendida
  UPDATE products 
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity_sold),
      updated_at = now()
  WHERE id = p_product_id;
  
  -- Se não encontrou o produto, retorna erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado: %', p_product_id;
  END IF;
END;
$$;