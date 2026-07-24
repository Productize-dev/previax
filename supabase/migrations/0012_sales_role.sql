-- Add sales role to user_role enum
alter type public.user_role add value if not exists 'sales';
