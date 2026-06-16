
-- payment-screenshots: anyone can upload, only admins can read/list/delete
CREATE POLICY "Anyone can upload payment screenshots" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-screenshots');
CREATE POLICY "Admins can read payment screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payment screenshots" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- public-read buckets: speaker-images, website-assets, qr-codes
CREATE POLICY "Public read speaker images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'speaker-images');
CREATE POLICY "Admins write speaker images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'speaker-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update speaker images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'speaker-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete speaker images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'speaker-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read website assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'website-assets');
CREATE POLICY "Admins write website assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update website assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'website-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete website assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'website-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read qr codes" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'qr-codes');
CREATE POLICY "Admins write qr codes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'qr-codes' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update qr codes" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'qr-codes' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete qr codes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'qr-codes' AND public.has_role(auth.uid(), 'admin'));
