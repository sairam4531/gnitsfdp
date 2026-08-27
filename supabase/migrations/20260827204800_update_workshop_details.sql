-- Update website settings with the new Humanoid Robot Workathon details
UPDATE public.website_settings
SET 
  fdp_title = 'Two Days Hands-On Workathon on ''ARTIFICIAL INTELLIGENCE HUMANOID ROBOT''',
  fdp_subtitle = 'under GNITS CSI Student Chapter — Gain hands-on experience in AI-powered humanoid robot technologies with BionicBot Hardware, Python SDK programming, Servo Control, and Computer Vision.',
  fdp_dates = '10 September 2026 – 11 September 2026',
  venue = 'CL-12 & 13, 4th Floor, Admin Block, GNITS, Hyderabad',
  description = 'The Department of CSE (Data Science), GNITS, Hyderabad is organizing a Two Days Hands-On Workathon on ''ARTIFICIAL INTELLIGENCE HUMANOID ROBOT'' under GNITS CSI Student Chapter. III B.Tech. I-Sem students of CSE, CSE(AI&ML), CSE(DS), and IT are encouraged to actively participate and utilize this opportunity to gain hands-on experience in AI-powered humanoid robot technologies, thereby enhancing their technical skills for future academic and professional endeavors.'
WHERE id IS NOT NULL;

-- Update payment settings to reflect the 600/- registration fee
UPDATE public.payment_settings
SET 
  internal_fee = 600,
  external_fee = 600
WHERE id IS NOT NULL;
