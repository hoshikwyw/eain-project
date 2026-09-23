-- 0006 Column defaults run as the inserting role. gifts.share_token and
-- gift_recipients.recipient_token default to public.generate_token(), so
-- signed-in creators need EXECUTE on it. The function only returns random
-- bytes, so this grants nothing sensitive. anon still has no access.

grant execute on function public.generate_token() to authenticated;
