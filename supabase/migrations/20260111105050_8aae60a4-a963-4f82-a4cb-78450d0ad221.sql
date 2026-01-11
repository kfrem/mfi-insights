-- Step 1: Add BOARD_DIRECTOR to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'BOARD_DIRECTOR';