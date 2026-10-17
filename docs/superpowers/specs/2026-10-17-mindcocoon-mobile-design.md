# MindCocoon Mobile — Bản thiết kế và lộ trình

Ngày: 2026-10-17 · Trạng thái: chờ duyệt
Nguồn: spec web `2026-10-16-mindcocoon-design.md` (mọi quyết định sản phẩm ở đó vẫn giữ nguyên) + yêu cầu ngày 2026-10-17.
Ký hiệu: **[Chủ dự án]** = chủ dự án quyết · **[Claude quyết]** = người làm quyết, có thể xem lại.

## 1. Ý định

**[Chủ dự án]** Đưa MindCocoon lên **App Store và Google Play** để **kiếm tiền bằng quảng cáo** (và gói Pro). Bản web tạm dừng phát triển.

Trải nghiệm và nguyên tắc giữ nguyên như bản web: người trẻ 15+ đang burnout, mở app lúc khuya, trút lòng → nhẹ lòng → ngủ. Riêng tư thật, an toàn, không gamification, quảng cáo không bao giờ chen vào lúc mở lòng.

**Thành công:** app được duyệt trên cả hai store; doanh thu đến từ banner + quảng cáo có thưởng + Pro; vẫn hướng tới 1.000 người mở mỗi đêm.

**Phản-mục-tiêu:** bị từ chối vì "chỉ là web bọc lại"; quảng cáo làm hỏng khoảnh khắc ban đêm; lộ nhật ký; app chạy chậm, giật trên máy tầm trung.

## 2. Nền tảng **[Claude quyết]**

**React Native với Expo** (dev build + EAS Build/Submit), TypeScript, Expo Router.

Lý do:
- Dùng chung **phần lõi TypeScript** đã viết và test (153 test): mã hóa két (DEK/KEK), kho cảm xúc, sao lưu đầu-cuối, câu gợi mở, dò cụm từ an toàn, đường dây hỗ trợ, từ điển vi/en. Flutter phải viết lại toàn bộ bằng Dart.
- Có sẵn thư viện chín cho AdMob (`react-native-google-mobile-ads`, kèm UMP consent), mua trong app (RevenueCat `react-native-purchases`), âm thanh nền (`expo-audio`), Keychain/Keystore (`expo-secure-store`).
- App native thật (không phải web bọc) → tránh bị Apple từ chối theo guideline 4.2.

Đã loại: **Capacitor bọc bản web** (nhanh nhất nhưng Next.js của ta dùng proxy/route handler không xuất tĩnh được, và rủi ro bị từ chối "web wrapper"); **Flutter** (viết lại hết lõi đã test).

## 3. Kiến trúc mã **[Claude quyết]**

Một repo, npm workspaces:

```
mindcocoon/                 (bản web Next.js giữ nguyên ở gốc)
├─ packages/core/           lõi dùng chung: types, crypto, keyring, vault session, mood store +
│                           selectors, backup (snapshot/engine/remote), prompts, safety,
│                           i18n dictionaries, dates, analytics thuần
└─ mobile/                  app Expo (Expo Router)
```

- Web chuyển import sang `@mindcocoon/core`; 153 test web phải giữ xanh sau khi tách.
- Phần khác nhau giữa nền tảng nằm sau các interface đã có sẵn trong `lib/storage`:
  - **Lưu trữ:** web = IndexedDB; mobile = SQLite (`expo-sqlite`) qua `KVDriver`.
  - **Khóa thiết bị:** web = CryptoKey không xuất được trong IndexedDB; mobile = 32 byte ngẫu nhiên trong **Keychain/Keystore** (`expo-secure-store`). Cần thêm `getOrCreateDeviceKey()` vào `VaultKeyRepository`.
  - **WebCrypto:** mobile dùng `react-native-quick-crypto` cài polyfill `crypto.subtle` (PBKDF2, AES-GCM). **Chưa xác minh chắc chắn trên Expo dev build → làm spike đầu tiên (go/no-go).** Nếu không đạt: dùng `@noble/ciphers` + `@noble/hashes` sau một interface `CryptoProvider`.

## 4. Phạm vi mobile v1

Đồng bộ tính năng với web v1, cộng phần kiếm tiền và yêu cầu store:

| Nhóm | Nội dung |
|---|---|
| Lõi (như web) | Hôm nay · Trút bỏ (tan chữ bằng Reanimated) · Két (mã khóa, mã khôi phục, đặt lại 1 giờ) · Cảm xúc tuần/tháng · Nơi trú (thở hộp, âm thanh nền, nhạc của đêm nay, hẹn giờ tắt) · An toàn (dò cụm từ, trang hỗ trợ offline) · Cài đặt · vi/en |
| Native thêm | Âm thanh phát khi khóa màn hình + điều khiển ở màn hình khóa · **Nhắc nhở buổi tối tùy chọn** (thông báo cục bộ, tắt mặc định, người dùng chọn giờ) — phục vụ mục tiêu thói quen hằng đêm **[Claude quyết]** · Face ID/vân tay để mở két (tùy chọn) **[Claude quyết]** · Rung nhẹ khi thả chữ |
| Tài khoản | Đăng nhập 16+ (email OTP; Google; **Sign in with Apple trên iOS — bắt buộc khi có Google theo guideline 4.8**) · Sao lưu đầu-cuối · Xóa tài khoản trong app |
| Kiếm tiền | Banner AdMob · Quảng cáo có thưởng mở khóa âm thanh premium 24 giờ · Pro qua mua trong app |
| Store | Icon, splash, ảnh chụp màn hình vi/en, chính sách quyền riêng tư, khai báo dữ liệu, xếp hạng độ tuổi |

**Không làm ở mobile v1:** đồng bộ nhiều thiết bị theo thời gian thực, widget, Apple Watch, iPad layout riêng.

## 5. Kiếm tiền

### 5.1 Quảng cáo (giữ nguyên quy tắc của web)
- **Vùng cấm:** Trút bỏ, Két, Thở, màn hình sau khi thả, trang hỗ trợ. **Không** quảng cáo toàn màn hình (interstitial), không quảng cáo âm thanh, không app-open ads.
- **Banner** (adaptive, cuối màn Hôm nay và Cảm xúc).
- **Quảng cáo có thưởng:** người dùng tự bấm "Xem quảng cáo để mở âm thanh này 24 giờ" cho 4 âm thanh premium (sấm xa, suối rừng, chuông xoay, tiếng ngân trầm) — đã có sẵn file.
- **Giờ yên tĩnh** 23:00–05:00: ẩn banner (quảng cáo có thưởng vẫn được vì người dùng tự chọn).
- **Chỉ quảng cáo không cá nhân hóa** (như web) → **không cần hỏi quyền theo dõi ATT trên iOS** **[Claude quyết]**. Đánh đổi: doanh thu mỗi lượt xem thấp hơn quảng cáo cá nhân hóa. Vẫn chạy luồng đồng ý UMP của Google cho người dùng ở EU/Anh.
- **Cờ điều khiển từ xa** (bật/tắt quảng cáo, giờ yên tĩnh) đọc từ bảng `app_config` trên Supabase, cache trên máy — đổi được **không cần cập nhật app** **[Claude quyết]**.
- Chặn nhóm quảng cáo nhạy cảm trong AdMob (hẹn hò, rượu bia, cờ bạc, giảm cân) như web.

### 5.2 Pro qua mua trong app **[Claude quyết]**
- Trên mobile **bắt buộc** dùng thanh toán của Apple/Google cho hàng số → câu hỏi cổng thanh toán VN/quốc tế của web **không áp dụng** cho app.
- Quản lý bằng **RevenueCat** (miễn phí tới mức doanh thu nhất định): entitlement `pro` = bỏ toàn bộ quảng cáo + mở mọi âm thanh premium.
- Gói đề xuất: **Pro trọn đời** (mua một lần) + **Pro theo tháng**. Giá đặt trong App Store Connect/Play Console, hiển thị theo tiền tệ địa phương (VND/USD tự động).
- **Không cần đăng nhập để mua Pro**: store tự lưu và khôi phục giao dịch ("Khôi phục giao dịch"). Khác với web (web cần tài khoản).

## 6. Yêu cầu của store (những thứ hay làm bị từ chối)

- **Apple:** Sign in with Apple khi có đăng nhập Google (4.8) · xóa tài khoản trong app (đã có) · nhãn quyền riêng tư (App Privacy) · app phải có giá trị native, không phải web bọc (4.2) · tuyên bố "không thay thế chuyên gia" (đã có) · đường link chính sách quyền riêng tư.
- **Google Play:** biểu mẫu An toàn dữ liệu (Data safety) · khai báo có quảng cáo · đối tượng mục tiêu (13+, không thuộc chương trình Gia đình) · khai báo ứng dụng sức khỏe (cần kiểm tra yêu cầu hiện hành) · xếp hạng nội dung IARC.
- **Tài khoản mới cá nhân trên Google Play phải chạy thử kín (closed testing) với một số người thử trong khoảng 14 ngày trước khi được phát hành** — cần kiểm tra con số hiện hành; ảnh hưởng trực tiếp tới thời gian ra mắt.

## 7. Việc chủ dự án cần chuẩn bị (không code được thay)

1. **Apple Developer Program** (99 USD/năm) và **Google Play Console** (25 USD một lần).
2. **AdMob**: tạo tài khoản, 2 app (iOS/Android), các ad unit: banner Hôm nay, banner Cảm xúc, rewarded.
3. **RevenueCat**: tạo project, nối với App Store Connect và Play Console; tạo sản phẩm Pro.
4. **Danh sách người thử** cho closed testing của Google Play (bạn bè, người thân).
5. **Expo account** (miễn phí) cho EAS Build.
6. Các việc trong `docs/LAUNCH_CHECKLIST.md` vẫn áp dụng (số đường dây, nhạc bản quyền, SMTP, pháp lý).

## 8. Lộ trình

| Giai đoạn | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| **M0** | Chủ dự án mở các tài khoản ở mục 7 (chạy song song với M1–M3) | Có App ID AdMob, project RevenueCat, quyền EAS |
| **M1** | Tách `packages/core`, web dùng lại; **spike crypto trên Expo dev build** (go/no-go) | 153 test web xanh; test lõi chạy được trên iOS + Android thật/giả lập |
| **M2** | Khung app Expo: điều hướng 5 tab, theme Dusk/Mist, font, vi/en, lưu trữ SQLite, khóa thiết bị trong Keychain | Mở app, đổi ngôn ngữ, dữ liệu còn sau khi tắt/mở lại |
| **M3** | Tính năng: Hôm nay, Trút bỏ (+ hiệu ứng tan chữ), Két, Cảm xúc, An toàn, Cài đặt | Test component + E2E (Maestro) cho luồng trút/thả, két, check-in |
| **M4** | Nơi trú native: âm thanh khi khóa màn hình, điều khiển màn hình khóa, hẹn giờ tắt, thở hộp | Nghe tiếp khi khóa máy trên cả hai nền tảng |
| **M5** | Tài khoản + sao lưu: Supabase RN, email OTP, Google, Sign in with Apple, deep link, xóa tài khoản | `test:live` + khôi phục trên máy thứ hai |
| **M6** | Kiếm tiền: AdMob (banner, rewarded, UMP), RevenueCat Pro, cờ từ xa `app_config` | Quảng cáo test hiện đúng chỗ, không hiện ở vùng cấm; mua Pro trong sandbox tắt quảng cáo |
| **M7** | Store: icon/splash, ảnh chụp, mô tả vi/en, privacy policy, Data safety/App Privacy, EAS Submit, TestFlight + closed testing | Bản build được duyệt thử nội bộ trên cả hai store |
| **M8** | Phát hành chính thức sau closed testing | App lên store |

Mỗi giai đoạn từ M1 sẽ có kế hoạch chi tiết riêng (writing-plans) trước khi code, như bản web.

## 9. Rủi ro chính

1. **Crypto trên React Native** — xử lý bằng spike M1, có phương án dự phòng `@noble/*`.
2. **Bị từ chối vì app sức khỏe tinh thần** — giữ tuyên bố, trang hỗ trợ, không tuyên bố chữa bệnh; kiểm tra số đường dây trước khi nộp.
3. **Doanh thu quảng cáo thấp** do chỉ dùng quảng cáo không cá nhân hóa và giờ yên tĩnh — chấp nhận ở bản đầu; đo bằng AdMob + `app_opens`, xem lại sau 1 tháng.
4. **Thời gian chờ closed testing của Google Play** — bắt đầu M0 sớm.
