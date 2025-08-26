-- Database Schema for Civixity Redemption System
-- Run this in your Supabase SQL editor to create the required tables

-- Redemptions table to track user redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id INTEGER NOT NULL,
  offer_title TEXT NOT NULL,
  offer_brand TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  voucher_code TEXT UNIQUE NOT NULL,
  redemption_type TEXT NOT NULL,
  validity_period TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  partner_verification TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_voucher_code ON redemptions(voucher_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_expires_at ON redemptions(expires_at);

-- RLS (Row Level Security) policies
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own redemptions
CREATE POLICY "Users can view own redemptions" ON redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can insert own redemptions" ON redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own redemptions
CREATE POLICY "Users can update own redemptions" ON redemptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically mark expired redemptions
CREATE OR REPLACE FUNCTION mark_expired_redemptions()
RETURNS void AS $$
BEGIN
  UPDATE redemptions 
  SET status = 'expired' 
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the expiration function (optional)
-- SELECT cron.schedule('mark-expired-redemptions', '0 0 * * *', 'SELECT mark_expired_redemptions();');

-- Profiles table to store user points and other profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  points INTEGER DEFAULT 1247,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);

-- RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Donations table to track user donations to NGOs
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_id INTEGER NOT NULL,
  ngo_name TEXT NOT NULL,
  ngo_category TEXT NOT NULL,
  points_donated INTEGER NOT NULL,
  donation_amount DECIMAL(10,2) NOT NULL,
  impact TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for donations table
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- RLS policies for donations
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own donations
CREATE POLICY "Users can insert own donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sample data for testing (optional)
-- INSERT INTO redemptions (user_id, offer_id, offer_title, offer_brand, points_spent, voucher_code, redemption_type, validity_period, expires_at)
-- VALUES 
--   ('your-user-id-here', 1, 'Metro Card - 10 Rides', 'City Metro', 200, 'METRO10-1234567890-ABC12', 'voucher', '3 months', NOW() + INTERVAL '3 months'),
--   ('your-user-id-here', 3, 'Local Restaurant Voucher', 'FoodieHub', 400, 'FOOD250-1234567891-DEF34', 'voucher', '2 months', NOW() + INTERVAL '2 months');

-- INSERT INTO donations (user_id, ngo_id, ngo_name, ngo_category, points_donated, donation_amount, impact)
-- VALUES 
--   ('your-user-id-here', 1, 'Green Earth Foundation', 'environment', 100, 50.00, 'Plant 1 tree for every ₹50 donated'),
--   ('your-user-id-here', 2, 'Clean Water Initiative', 'health', 80, 40.00, 'Provide clean water to 1 family for a month'); 