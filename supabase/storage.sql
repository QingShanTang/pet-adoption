-- Storage bucket policies for pet-images
-- Run in Supabase SQL Editor AFTER creating the 'pet-images' bucket in Dashboard → Storage

-- Allow admins to upload pet images
create policy "Admins can upload pet images"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-images' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can view pet images (bucket is public)
create policy "Anyone can view pet images"
  on storage.objects for select
  using (bucket_id = 'pet-images');
