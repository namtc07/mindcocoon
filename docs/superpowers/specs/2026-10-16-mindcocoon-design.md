# MindCocoon — Bản thiết kế sản phẩm (v1 → v2)

Ngày: 2026-10-16 · Trạng thái: chờ duyệt
Nguồn: spec gốc của chủ dự án + buổi brainstorming 2026-10-16.
Ký hiệu: **[Chủ dự án]** = do chủ dự án quyết; **[Đề xuất – đã đồng ý]** = Claude đề xuất, chủ dự án xác nhận; **[Claude quyết]** = quyết định của người làm, có thể xem lại.

---

## 1. Ý định và lý do

MindCocoon là một "nơi trú ẩn" số để trút bỏ cảm xúc, viết nhật ký riêng tư và thả lỏng tâm trí — cho kiệt sức, cô đơn, lo âu, giai đoạn chuyển tiếp trong đời (không chỉ chia tay).

**Khoảnh khắc cốt lõi [Chủ dự án]:** một người trẻ đang burnout mở app lúc khuya. Trong vài phút, họ được **trút hết ra, thấy nhẹ lòng, và dễ ngủ hơn**.

**Người dùng [Chủ dự án]:** từ **15 tuổi trở lên** (cả học sinh cấp 3); nhóm trọng tâm là người 20–30 tuổi bị burnout. Hai thị trường: **Việt Nam và quốc tế**.

**Giả định [Claude quyết]:** đa số dùng trên điện thoại, trên giường, trong phòng tối → mobile-first, nền tối mặc định, không có gì chói hay nhấp nháy.

## 2. Mục tiêu, không-mục-tiêu, phản-mục-tiêu

**Thành công sau 3 tháng [Chủ dự án]:** **1.000 người dùng mở app đều đặn mỗi đêm.** Thước đo là thói quen quay lại, không phải lượt tải hay doanh thu.

**Mục tiêu**

- Con đường chính nhanh và nhẹ: Hôm nay → Trút bỏ → Thả vào hư không → bật âm thanh/nhạc → đặt máy xuống ngủ.
- Quay lại dễ: cài được lên màn hình chính (PWA), mở nhanh, không bắt đăng nhập.
- Riêng tư thật: nội dung viết không bao giờ rời máy ở dạng đọc được; người làm app không đọc được nhật ký.

**Không-mục-tiêu (ở v1)**

- Không thay thế chuyên gia tâm lý, không chẩn đoán.
- Không mạng xã hội, không chia sẻ, không cộng đồng.
- Không phân tích nội dung bằng AI/máy chủ.

**Phản-mục-tiêu (dù chạy được vẫn là thất bại)**

- Người dùng thấy bị app "điều khiển" hoặc ép theo nghi thức. → Màn hình mở là **Hôm nay**, người dùng tự chọn đi đâu **[Chủ dự án]**.
- Quảng cáo phá khoảnh khắc mở lòng.
- Gamification gây áp lực: streak, huy hiệu, bộ đếm, chấm đỏ thông báo.
- Mất nhật ký của người dùng vì quên mã mà không có đường lui.

## 3. Phạm vi theo bản [Đề xuất – đã đồng ý: ra mắt bản gọn rồi bổ sung dần]

| Bản | Nội dung |
|---|---|
| **v1 (ra mắt)** | Hôm nay · Trút bỏ (thả vào hư không / cất vào Két) · Két có mã hóa, mã khóa tùy chọn, mã khôi phục 12 từ, lấy lại trên máy (chờ 1 giờ) · **Đăng nhập tùy chọn (16+) + sao lưu đám mây mã hóa đầu-cuối + khôi phục trên máy mới + lấy lại mã két qua đăng nhập** (mục 6.1) · Bản đồ cảm xúc tuần/tháng · Sanctuary: thở 1 phút, 4 âm thanh nền miễn phí, **Nhạc của đêm nay** (nhạc tạm), **hẹn giờ tắt** · An toàn (mục 8) · Tiếng Việt + tiếng Anh · PWA cài được, trang hỗ trợ chạy offline · Thống kê ẩn danh · Khung quảng cáo dựng sẵn nhưng **tắt** |
| **v1.1** (vài tuần sau) | Luồng Pro + thanh toán **dựng sẵn nhưng tắt** · Âm thanh premium + mở khóa bằng quảng cáo có thưởng · Nhạc từ file trong máy người dùng · Link mở playlist gợi ý trên Spotify/YouTube (mở ra ngoài app) · Bật banner khi AdSense duyệt |
| **v2** | **Đồng bộ liên tục nhiều thiết bị** (v1 chỉ sao lưu + khôi phục) · Bật thanh toán thật · App mobile (Flutter hoặc React Native, dùng chung data contract) · Spotify/Apple Music SDK trên mobile cho người có gói trả phí |

> Đăng nhập + sao lưu đám mây được đưa lên v1 **[Chủ dự án chọn phương án C]** để người dùng không mất nhật ký khi mất/đổi máy hoặc khi trình duyệt tự xóa dữ liệu.

## 4. Tính năng v1 — chi tiết

### 4.1 Hôm nay (màn hình mở app) [Chủ dự án chọn phương án B]

- Lời chào theo thời điểm trong ngày.
- **Câu gợi mở của ngày** ở cỡ chữ lớn (serif) — cố định trong ngày, có nút "câu khác". Bấm "Viết về điều này" → sang Trút bỏ với câu gợi mở hiển thị mờ phía trên.
- **Check-in cảm xúc nhanh**: 5 trạng thái (Bình yên, Hy vọng, Trống rỗng, Nặng nề, Lo âu), chạm một lần là lưu; mở rộng để thêm thẻ tình huống và ghi chú.
- Lối vào: Trút bỏ, Thở 1 phút, Âm thanh/Nhạc của đêm nay.
- Dòng nhắc nhẹ dựa trên bản đồ cảm xúc (mục 8) khi đủ điều kiện.
- Vị trí banner (cuối trang) — v1 tắt.

### 4.2 Trút bỏ (Safe Vent)

- Toàn màn hình, không gây xao nhãng; điều hướng ẩn khi đang viết. Thanh âm thanh mini vẫn hiển thị.
- **Thả vào hư không:** chữ tan thành tro/đốm sáng bay lên (Framer Motion), sau đó nội dung bị xóa khỏi bộ nhớ, **không lưu ở đâu**, không bản nháp tự động, không còn trong lịch sử hoàn tác. Tôn trọng `prefers-reduced-motion` (chỉ mờ dần).
- Sau khi thả: một màn hình yên tĩnh ngắn ("Đã buông.") với lối sang âm thanh/nhạc. **Không quảng cáo.**
- **Cất vào Két:** tiêu đề tùy chọn + nội dung → mã hóa và lưu (mục 4.3). Nếu két đang khóa → hỏi mã trước khi lưu.
- Dòng "Cần nói chuyện với ai đó ngay?" luôn có ở góc màn hình.
- Kiểm tra cụm từ nguy cơ khi bấm Thả hoặc Cất (mục 8).

### 4.3 Két riêng (Private Vault)

- **Mặc định không có mã khóa:** nhật ký vẫn mã hóa trên máy (AES-GCM 256, khóa ngẫu nhiên không xuất được lưu trong IndexedDB); mở là đọc.
- **Mã khóa tùy chọn:** bật trong Két. Tự khóa khi không hoạt động/ẩn tab N phút (mặc định 5) và có nút "Khóa ngay".
- **Đường lui khi quên mã [Đề xuất – đã đồng ý]:**
  1. **Mã khôi phục 12 từ** — hiện khi đặt mã khóa, nhắc chụp/ghi lại; nhập vào là đặt mã mới ngay.
  2. **Lấy lại trên cùng máy, chờ 1 giờ** — bấm "Quên mã" → đếm ngược 1 giờ → mở app lại trên cùng máy để đặt mã mới; nhật ký còn nguyên. *(Mô hình đe dọa: chặn người nhìn trộm cầm máy tiện tay, ví dụ người nhà; không chống người rành kỹ thuật cầm máy lâu — chấp nhận.)*
  3. **Qua đăng nhập** — đặt mã mới ngay (trên máy đang có nhật ký). Máy chủ chỉ giữ "nửa chìa khóa", nhật ký vẫn chỉ ở trên máy → người làm app vẫn không đọc được.
- **Không** có đường lui qua email/hỗ trợ viên mà người làm app giữ chìa.
- **Gợi ý đăng nhập, đúng 3 lúc** (lời gợi ý: "Đăng nhập để sao lưu, không bao giờ mất nhật ký"): khi đặt mã khóa; một lần khi két có ~5 bài; một dòng cố định trong Cài đặt. Không popup lặp lại. Người dưới 16 tuổi không thấy.
- Xem, sửa, xóa từng bài; danh sách theo thời gian.

**Hướng kỹ thuật [Claude quyết]:** dùng mô hình **khóa dữ liệu (DEK) + các khóa bọc (KEK)**: một DEK ngẫu nhiên mã hóa mọi bài; DEK được bọc riêng bởi (a) khóa từ mã khóa (PBKDF2), (b) khóa từ mã khóa phục hồi, (c) khóa thiết bị cho đường lui 1 giờ, (d) bí mật phía máy chủ (chỉ dùng cho "quên mã" trên máy đang có dữ liệu — xem 6.1). Đổi mã chỉ cần bọc lại DEK, không mã hóa lại toàn bộ bài. *(Code hiện có ở `lib/vault.ts` mã hóa trực tiếp bằng khóa dẫn xuất — cần refactor sang mô hình này.)*

### 4.4 Bản đồ cảm xúc (Mood Pulse)

- Check-in: 5 trạng thái + thẻ tình huống mặc định **Công việc, Mối quan hệ, Một mình, Gia đình, Sức khỏe, Học tập** + thẻ tự thêm + ghi chú ngắn.
- **Tuần:** dải 7 ngày, mỗi ngày một chấm màu cảm xúc (không trục số, không điểm).
- **Tháng:** lịch nhiệt (heatmap) theo màu cảm xúc, chạm vào ngày để xem chi tiết.
- Không có điểm số, phần trăm, streak.
- Vị trí banner (cuối trang) — v1 tắt.

### 4.5 Sanctuary

- **Thở hộp 1 phút:** hít 4s – giữ 4s – thở 4s – giữ 4s, 4 vòng (~64s), hoạt ảnh SVG mượt; bản giảm chuyển động khi người dùng bật reduced motion.
- **Âm thanh nền miễn phí:** Mưa, Sóng biển, Gió đêm, Lửa trại. Trộn nhiều âm cùng lúc, âm lượng riêng từng cái + âm lượng tổng, lặp, phát nền khi chuyển trang/khóa màn hình (Media Session).
- **Nhạc của đêm nay [Chủ dự án]:** nhạc không lời (piano, lo-fi). Mỗi bản gắn với một hay nhiều cảm xúc; mỗi đêm chọn một bản theo **cảm xúc check-in gần nhất** (không check-in → chọn theo ngày). Phát chung được với âm thanh nền. **v1 dùng nhạc tạm** (Claude tạo bằng code); thay bằng nhạc có bản quyền trước khi ra mắt.
- **Hẹn giờ tắt:** 10 / 20 / 30 / 60 phút, âm lượng nhỏ dần trong ~1 phút cuối rồi dừng.
- Thanh âm thanh mini hiển thị trên mọi trang khi đang phát/tạm dừng.

### 4.6 Ngôn ngữ [Chủ dự án: cả hai]

- Tiếng Việt và tiếng Anh cho toàn bộ giao diện, câu gợi mở, trang hỗ trợ.
- Tự chọn theo ngôn ngữ trình duyệt; đổi được trong Cài đặt; ghi nhớ lựa chọn.

### 4.7 Cài đặt

- Ngôn ngữ, giao diện (Tối "Dusk" mặc định / Sáng dịu "Mist"), Két (mã khóa, tự khóa), xuất dữ liệu (JSON; nhật ký ở dạng đã mã hóa), xóa toàn bộ dữ liệu, tuyên bố "không thay thế chuyên gia", link trang hỗ trợ.

### 4.8 PWA

- Cài được lên màn hình chính, mở nhanh, biểu tượng + màn hình chờ hợp theme.
- Trang hỗ trợ và giao diện chính dùng được khi mất mạng; dữ liệu vốn ở trên máy.

## 5. Kiếm tiền

### 5.1 Quy tắc quảng cáo [Đề xuất – đã đồng ý]

- **Vùng cấm tuyệt đối:** Trút bỏ, Két, Thở, màn hình sau khi thả, trang hỗ trợ.
- **Không bao giờ:** quảng cáo toàn màn hình, quảng cáo âm thanh, quảng cáo tự bật video.
- **Được phép:** một banner nhỏ, tĩnh, cuối trang Hôm nay và Bản đồ cảm xúc (phải cuộn mới thấy); quảng cáo có thưởng do người dùng tự bấm để mở âm thanh premium 24 giờ (v1.1).
- **Chỉ quảng cáo không cá nhân hóa** cho tất cả; chặn nhóm nhạy cảm (hẹn hò, rượu bia, cờ bạc, giảm cân…) — vì có người dùng dưới 18.
- **Giờ yên tĩnh** 23:00–05:00 (giờ máy người dùng): ẩn banner. Là **cờ cấu hình** đổi được không cần sửa code; ra mắt ở trạng thái **bật**; xem lại sau ~1 tháng dựa trên thống kê.
- Pro → không có quảng cáo.
- v1: toàn bộ khung quảng cáo dựng sẵn nhưng **tắt** (AdSense thường chỉ duyệt khi đã có lưu lượng).

### 5.2 Pro và thanh toán [Chủ dự án: dựng sẵn nhưng chưa dùng]

- Pro = bỏ quảng cáo + mở khóa mọi âm thanh/nhạc premium (+ đồng bộ ở v2).
- Mua Pro yêu cầu **tạo tài khoản** (để không mất gói khi đổi máy).
- Hai cổng thanh toán, chọn theo khu vực/ngôn ngữ: **Việt Nam** (cổng nội địa: PayOS / VNPay / MoMo — VND) và **quốc tế** (merchant of record: Paddle / Lemon Squeezy — USD). Lưu ý Stripe không nhận doanh nghiệp đăng ký tại Việt Nam.
- Dựng một lớp trừu tượng thanh toán cắm được nhiều cổng; toàn bộ luồng sau một **công tắc**; khi tắt hiển thị "Sắp ra mắt".
- Không cần cổng xác nhận 18+ **[Chủ dự án]**; độ tuổi người mua do cổng/cửa hàng ứng dụng xử lý.

## 6. Tài khoản, dữ liệu, thống kê

- **Không bắt buộc đăng nhập** để dùng bất cứ tính năng nào của v1 **[Đề xuất – đã đồng ý]**.
- **Đăng nhập tùy chọn (v1)**, chỉ cho người **từ 16 tuổi** (hỏi xác nhận khi tạo tài khoản — theo Nghị định 13/2023 về dữ liệu cá nhân của người dưới 16). Dưới 16 vẫn dùng đầy đủ tính năng trên máy.
- Hướng kỹ thuật: Supabase — tài khoản ẩn danh vô hình, "nâng cấp" lên email/Google không mất dữ liệu; Row Level Security.
- **Thống kê ẩn danh (v1):** mã ngẫu nhiên tạo trên máy (không tên, không email), mỗi lần mở app gửi một sự kiện "đã mở" kèm giờ và ngôn ngữ. Dùng để đếm người dùng mỗi đêm / tỷ lệ quay lại và quyết định giờ yên tĩnh. **Không bao giờ** gửi nội dung viết, cảm xúc chi tiết hay ghi chú. Chấp nhận sai số (nhiều máy, xóa dữ liệu, tab ẩn danh). Có công tắc tắt thống kê trong Cài đặt. *(Chọn công cụ: để người làm quyết, miễn đáp ứng các ràng buộc trên.)*

### 6.1 Sao lưu đám mây (v1) [Chủ dự án chọn C; chi tiết: Claude quyết]

- Chỉ dành cho người đã đăng nhập. Bật mặc định sau khi đăng nhập, tắt được.
- **Mã hóa đầu-cuối:** mọi thứ gửi lên (nhật ký, ghi chú cảm xúc, **cả màu cảm xúc và thẻ**) đều được mã hóa trên máy bằng DEK trước khi gửi. Máy chủ chỉ thấy các khối dữ liệu mã hóa + thời điểm cập nhật. Lý do: dữ liệu cảm xúc là dữ liệu sức khỏe nhạy cảm theo Nghị định 13; không đọc được thì không phải xử lý.
- **Giữ lời hứa "người làm app không đọc được":** máy chủ **không bao giờ** đồng thời có cả bản sao lưu và chìa khóa mở nó.
  - Trên **máy đang dùng**, quên mã → đăng nhập là đặt mã mới ngay (dùng bí mật phía máy chủ + dữ liệu sẵn trên máy).
  - Trên **máy mới**, khôi phục bản sao lưu = đăng nhập **+ mã khôi phục 12 từ** (hoặc mã khóa két nếu đã đặt). Vì vậy khi đăng nhập lần đầu, người dùng chưa có mã khôi phục sẽ được tạo và nhắc lưu mã khôi phục.
  - Mất máy **và** mất mã khôi phục **và** quên mã khóa → không khôi phục được. App nói rõ điều này khi hiện mã khôi phục.
- **Sao lưu, chưa phải đồng bộ:** v1 tự đẩy bản sao lưu sau mỗi thay đổi (gom lại, có thử lại khi mất mạng) và khôi phục toàn bộ khi đăng nhập trên máy mới. Dùng song song nhiều máy cùng lúc (gộp thay đổi) để v2.
- Người **dưới 16** không tạo được tài khoản → không có sao lưu đám mây; chỉ có biện pháp giảm nhẹ: khuyến khích cài app lên màn hình chính, xin trình duyệt giữ dữ liệu lâu dài (`navigator.storage.persist()`).
- Xóa tài khoản trong Cài đặt → xóa toàn bộ bản sao lưu trên máy chủ.

## 7. Giao diện

**Ràng buộc từ spec [Chủ dự án]:** tối giản, yên tĩnh; slate `#0F172A` + `#F1F5F9`, điểm nhấn amber/teal dịu; không badge, bộ đếm hay gamification.

**[Claude quyết]:**

- Màu: nền `#0F172A`, chữ `#F1F5F9`, nhấn sage-teal `#7FB5A8`, ember amber `#D9A86C` dành riêng cho hiệu ứng "hư không". Màu cảm xúc: Bình yên teal, Hy vọng amber, Trống rỗng xám slate, Nặng nề chàm hoàng hôn, Lo âu hồng tro. Theme sáng "Mist" dịu.
- Chữ: Newsreader (serif — câu gợi mở, bề mặt viết) + Hanken Grotesk (giao diện). Cả hai hỗ trợ tiếng Việt (cần kiểm tra subset `vietnamese` khi tải font).
- Bố cục: rail trái trên desktop, tab bar dưới trên mobile; nội dung căn trái, rộng tối đa ~680px.
- Chuyển động: chỉ một điểm nhấn lớn (tan chữ); mọi chỗ khác tiết chế; tôn trọng reduced motion.

## 8. An toàn [Đề xuất – đã đồng ý, kèm bổ sung]

- **Dòng hỗ trợ luôn có sẵn** ở Trút bỏ và Cài đặt: "Cần nói chuyện với ai đó ngay?" → **trang hỗ trợ**.
- **Trang hỗ trợ:** đường dây theo quốc gia (Việt Nam trước, kèm số cấp cứu 115; đường dây cho trẻ em/thanh thiếu niên ở vị trí dễ thấy; quốc tế + findahelpline.com). Ghi **giờ hoạt động** từng đường dây và ưu tiên hiển thị đường dây đang trực. Chạy **offline**.
- **Kiểm tra cụm từ trên máy** (VI + EN) khi bấm Thả hoặc Cất. Nếu khớp: thẻ dịu "Những gì bạn vừa viết nghe rất nặng. Bạn không phải một mình." + nút gọi đường dây + nút **"Tiếp tục thả"**. Không chặn, không lưu, không gửi, không báo ai. Tối đa một lần mỗi phiên. Danh sách cụm từ tránh báo nhầm kiểu "chết cười", "mệt muốn chết", "giết thời gian".
- **Nhắc nhẹ theo bản đồ cảm xúc:** "Nặng nề" nhiều ngày liền (ví dụ 7) → một dòng gợi ý nói chuyện với ai đó; tối đa 1 lần/tuần; tính trên máy; không hiển thị số ngày.
- **Tuyên bố** "không thay thế chuyên gia" ở lần mở đầu và Cài đặt; không dùng từ "chữa", "điều trị".

## 9. Kiến trúc kỹ thuật

**Đã quyết trong spec gốc [Chủ dự án]:** Next.js (App Router, TypeScript, React 19+), Tailwind CSS, shadcn/ui (Radix), Lucide, Framer Motion; local-first (IndexedDB) với lớp trừu tượng `/lib/storage` sẵn sàng cắm Supabase/PostgreSQL + RLS; mobile ở giai đoạn sau dùng chung data model/contract.

**Hiện trạng code (đã dựng trước buổi brainstorming, giữ lại):** Next.js 16.4 + React 19.3 (bật `cacheComponents` — trang cũ được giữ bằng `<Activity>`), Tailwind v4, shadcn base Radix; `types/`, `lib/storage` (driver IndexedDB/bộ nhớ + repository), `lib/crypto.ts` (AES-GCM, PBKDF2), `lib/vault.ts` (cần refactor sang DEK/KEK), `lib/audio-engine.ts` (mixer, Media Session), `lib/mood-store.ts`, `lib/entitlements.ts`, `scripts/generate-ambient.mjs` + 8 file âm thanh tạm trong `public/audio`, theme token trong `app/globals.css`.

**Data contract** — giữ nguyên các interface trong spec gốc (`MoodLog`, `JournalEntry`, `SoundTrack`). Bổ sung **[Claude quyết]**: `SoundTrack.category` có giá trị `"music"` cho nhạc; thêm trường tùy chọn `moods?: MoodType[]` để gắn nhạc với cảm xúc; `JournalEntry.content` khi mã hóa là phong bì `v1.<iv>.<ciphertext>`, tiêu đề nằm trong phần mã hóa.

**Supabase (v1):** migration SQL cho bản sao lưu mã hóa (chỉ ciphertext), bảng bí mật khôi phục két, và (v1.1) `entitlements`; RLS theo `auth.uid()`.

**Để người làm quyết:** cấu trúc component cụ thể, thư viện i18n, công cụ thống kê, cách sinh nhạc tạm, chi tiết hoạt ảnh.

## 10. Việc phải làm trước khi ra mắt (ngoài code)

1. Kiểm tra lại **số và giờ hoạt động** mọi đường dây hỗ trợ (VN + quốc tế).
2. Nhờ người có chuyên môn tâm lý duyệt câu chữ an toàn, câu gợi mở và danh sách cụm từ.
3. Thay **nhạc tạm** bằng nhạc có bản quyền dùng trong app (mua/đặt từ nhạc sĩ; đọc kỹ giấy phép — nhiều kho "royalty-free" cấm dùng như thư viện nghe trong app). Âm thanh nền tạm có thể giữ hoặc thay.
4. **Trước khi ra mắt v1** (vì đăng nhập + sao lưu đã lên v1): tư vấn pháp lý về Nghị định 13/2023 (dữ liệu người dưới 16, dữ liệu sức khỏe, chính sách quyền riêng tư, nơi đặt máy chủ). Trước khi bật thanh toán (v1.1+): xác định tư cách nhận tiền (cá nhân/công ty) để chọn cổng.
6. Viết **Chính sách quyền riêng tư** và **Điều khoản sử dụng** (bắt buộc khi có tài khoản).
5. Đăng ký AdSense khi có lưu lượng.

## 11. Quyết định sau review [Claude quyết]

- **Ghi chú trong check-in cảm xúc là nội dung riêng tư** (người dùng tự viết): mã hóa bằng khóa két giống nhật ký. Màu cảm xúc và thẻ tình huống lưu dạng thường trên máy để bản đồ vẫn hiển thị khi két khóa; ghi chú bị ẩn khi két khóa. Khi lên máy chủ (v2), ghi chú cũng chỉ ở dạng mã hóa.
- **Máy chủ ở v1:** hosting (mặc định Vercel), **Supabase** (đăng nhập + lưu bản sao lưu mã hóa + bí mật khôi phục, RLS theo `auth.uid()`), và một dịch vụ thống kê ẩn danh. Cờ cấu hình (giờ yên tĩnh, bật/tắt quảng cáo, bật/tắt thanh toán) dùng **biến môi trường + deploy lại** — đáp ứng "không cần sửa code"; không cần cấu hình trực tiếp ở v1.
- **Kế hoạch triển khai đầu tiên chỉ bao gồm v1** (gồm cả đăng nhập, sao lưu và migration Supabase tương ứng). Lớp thanh toán thuộc kế hoạch v1.1.
- **Trang hỗ trợ lúc ra mắt:** danh sách chọn lọc cho Việt Nam (có giờ hoạt động và logic "đang trực") + vài nước chính (Mỹ, Anh, Úc, Singapore…) ở dạng số + link, + findahelpline.com cho phần còn lại. Mọi dữ liệu nằm trong app, chạy offline.

## 12. Quyết định để sau

- Cách gộp thay đổi khi **đồng bộ liên tục nhiều máy** (v2); mã hóa đã chốt ở 6.1.
- Cổng thanh toán cụ thể cho từng thị trường.
- Có giữ giờ yên tĩnh hay không (sau ~1 tháng số liệu).
- Flutter hay React Native cho mobile.
