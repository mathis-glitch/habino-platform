-- Add credits column to profiles for ALL users (not just brokers)
-- Every new user starts with 0 credits; give 1000 bonus to all existing users.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;

-- Grant 1000 bonus credits to every existing profile
UPDATE profiles SET credits = credits + 1000 WHERE credits = 0;
