-- Seed data for development/testing
-- Run this in Supabase SQL Editor after running 001_initial_schema.sql

insert into public.pets (name, species, breed, age, gender, description, status) values
  ('小橘', 'cat', '橘猫', 24, 'male', '活泼好动，喜欢玩玩具，已绝育', 'available'),
  ('豆豆', 'dog', '柴犬', 12, 'female', '温顺亲人，适合有孩子的家庭', 'available'),
  ('雪球', 'cat', '布偶猫', 36, 'female', '性格安静，喜欢被抱', 'available');
