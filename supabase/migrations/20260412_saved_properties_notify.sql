-- Track last price we sent a push notification for on each saved property
-- Null = never notified; set to current price after sending alert

alter table saved_properties
  add column if not exists notified_price numeric;
