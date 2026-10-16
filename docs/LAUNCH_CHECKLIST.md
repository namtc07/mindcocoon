# Launch checklist / Danh sách trước khi ra mắt

Everything here is outside the code and must be done by people before v1 goes public.

## Safety / An toàn
- [ ] Verify every number **and** its hours in `lib/safety/hotlines.ts` (VN 115, VN 111, US 988, UK Samaritans 116 123, AU Lifeline 13 11 14, SG SOS 1767); add any Vietnamese mental-health line you can confirm; set `verified: true` only after a person has checked it.
- [ ] Have a native speaker and a mental-health professional review `lib/safety/phrases.ts`, the gentle-card copy, the reflection prompts and the disclaimer.

## Content / Nội dung
- [ ] Replace the placeholder music (`public/audio/music/*`) with licensed tracks whose licence allows in-app listening (many "royalty-free" libraries forbid this). Ambient placeholders may stay or be replaced.
- [ ] Privacy Policy and Terms of Use pages (required now that accounts exist).

## Legal / Pháp lý
- [ ] Legal review against Nghị định 13/2023: data of users under 16, health-related data, privacy policy, server location.
- [ ] Before turning on payments (v1.1+): decide individual vs company, then choose the VN and international gateways.

## Supabase
- [ ] Apply `supabase/migrations/0001_init.sql` and run the security advisors.
- [ ] Enable Email OTP + Google; add redirect URLs for the production domain.
- [ ] Configure production SMTP for sign-in codes.
- [ ] Rotate the service-role key (it was shared in a chat): create an `sb_secret_…` key, update Vercel, disable legacy JWT keys.

## Ads (after launch, once there is traffic)
- [ ] Apply to AdSense; once approved set `NEXT_PUBLIC_ADS_ENABLED=true`, client and slot ids.
- [ ] In the AdSense dashboard block sensitive categories (dating, alcohol, gambling, weight loss).
- [ ] After ~1 month of `app_opens` data, decide whether to keep quiet hours (`NEXT_PUBLIC_QUIET_HOURS`).
