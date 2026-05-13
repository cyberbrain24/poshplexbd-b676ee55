-- Drop Independent Inventory module table and its trigger function
DROP TRIGGER IF EXISTS trg_update_inventory_product_stock ON public.inventory_entry_items;
DROP FUNCTION IF EXISTS public.update_inventory_product_stock() CASCADE;
DROP TABLE IF EXISTS public.inventory_products CASCADE;

-- Drop Chatbot module tables and related helpers
DROP FUNCTION IF EXISTS public.ensure_single_chatbot_settings() CASCADE;
DROP FUNCTION IF EXISTS public.assign_chatbot_guest_number() CASCADE;
DROP SEQUENCE IF EXISTS public.chatbot_guest_number_seq CASCADE;

DROP TABLE IF EXISTS public.chatbot_messages CASCADE;
DROP TABLE IF EXISTS public.chatbot_conversations CASCADE;
DROP TABLE IF EXISTS public.chatbot_learnings CASCADE;
DROP TABLE IF EXISTS public.chatbot_learning_runs CASCADE;
DROP TABLE IF EXISTS public.chatbot_faqs CASCADE;
DROP TABLE IF EXISTS public.chatbot_settings CASCADE;