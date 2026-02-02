-- Test script to validate the position constraint fix
-- Run this after applying the migration

-- 1. Check if the problematic constraint exists
SELECT constraint_name 
FROM information_schema.constraint_column_usage
WHERE table_name = 'transferencias' AND column_name = 'position';

-- 2. Check the position column exists and has correct default
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'transferencias' AND column_name = 'position';

-- 3. Verify no UNIQUE constraints on position
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'transferencias' AND constraint_type = 'UNIQUE';

-- 4. Check trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trg_auto_increment_transfer_position';

-- 5. List all indexes on transferencias
SELECT indexname FROM pg_indexes
WHERE tablename = 'transferencias';

-- 6. Count transfers by contact to verify positions
SELECT contact_id, COUNT(*) as transfer_count, MIN(position) as first_pos, MAX(position) as last_pos
FROM public.transferencias
GROUP BY contact_id
ORDER BY transfer_count DESC;

-- 7. Test: Insert a new transfer (should auto-increment position)
-- First, find a contact
SELECT id, company_id FROM public.contacts LIMIT 1;

-- Then test the insert with auto-position (position will be auto-calculated)
-- INSERT INTO public.transferencias (
--   api_key,
--   contact_id,
--   departamento_origem_id,
--   departamento_destino_id
-- ) VALUES (
--   'your-api-key',
--   'contact-uuid',
--   'dept-uuid-1',
--   'dept-uuid-2'
-- );
-- SELECT * FROM public.transferencias WHERE contact_id = 'contact-uuid' ORDER BY position DESC;
