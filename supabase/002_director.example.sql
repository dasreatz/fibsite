-- First create and confirm your own user in Authentication > Users.
-- Replace the placeholder with that user's UUID (not an email or password).
-- Run only once, after reviewing the UUID.
insert into public.fib_members(user_id,rp_name,rank,unit,position)
values ('00000000-0000-0000-0000-000000000000','Kai Muerte',12,'ЦСО «А»','Керівник');
