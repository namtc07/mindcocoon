# Look and feel — báo cáo

Nhánh `feat/mobile-look-and-feel`. Mục tiêu: học **cách làm** của Calm, How We Feel, Finch, BetterSleep để app ấm áp và có hình ảnh hơn, **không sao chép** tên, logo, hình, âm thanh hay câu chữ của họ (Apple từ chối app nhái theo Guideline 4.1, và còn rủi ro bản quyền).

## Có gì mới

| Học từ | Trong MindCocoon |
|---|---|
| Mọi app tử tế | **Icon và màn khởi động riêng**: chiếc kén treo trên sợi tơ, có ánh ấm bên trong và trăng khuyết. Tạo lại bằng `npm run gen:brand`. |
| Calm (ảnh nền) | **Bầu trời theo giờ** trên đầu màn Hôm nay: sáng, chiều, hoàng hôn, đêm (đêm có sao lấp lánh). Vẽ bằng SVG, đứng yên khi bật Giảm chuyển động. |
| Finch (linh vật) | **Kén**, một chiếc kén nhỏ có khuôn mặt: ngái ngủ ban đêm, bình yên ban ngày, vui sau khi buông chữ. Kén cũng xuất hiện ở trang trống (kho riêng tư, lịch sử cảm xúc, hộp lo âu) và màn "Ngủ ngon". Kén không đòi gì cả: không cho ăn, không cấp độ, không chuỗi ngày. |
| How We Feel (lưới cảm xúc) | **Bản đồ cảm xúc**: 5 quả cầu màu đặt theo hai trục năng lượng × dễ chịu, dùng ở Hôm nay và Thư giãn trước khi ngủ. Mỗi cảm xúc có **8 từ** (trước đây 5), hiện thành ô mang màu của cảm xúc đó. |
| BetterSleep, Calm (thẻ có tranh) | **Thẻ mix có tranh**: Đêm mưa, Bên đống lửa, Gió biển, Mưa trên biển. Màn "Ngủ ngon" hiện tranh của mix vừa chọn. |
| Calm, Finch (màn chào) | **Màn chào 3 bước**: app là gì (kèm lời nhắc app không thay bác sĩ) → điều gì đưa bạn đến đây → tên gọi và nhắc nhở buổi tối. Mọi bước đều bỏ qua được. Lời chào dùng tên của bạn. Ai chọn "Ngủ ngon hơn" thì ban đêm thấy "Thư giãn trước khi ngủ" trước tiên; ai chọn "Hiểu cảm xúc" thì ban ngày thấy check-in sớm hơn. Có thể đổi tên trong Cài đặt. |

## Cách thử

1. Build lại vì icon và màn khởi động là phần native: `npx expo prebuild --clean -p ios && (cd ios && pod install) && npx expo run:ios`.
2. Muốn thấy màn chào: Cài đặt → Xoá mọi thứ (hoặc cài lại app).
3. Hôm nay: xem bầu trời đổi theo giờ, Kén, bản đồ cảm xúc. Chọn một cảm xúc để thấy các ô từ có màu.
4. Sanctuary: các thẻ mix có tranh. Thư giãn trước khi ngủ → Chúc ngủ ngon → tranh và Kén ngủ.
5. Bật Giảm chuyển động (Cài đặt iOS → Trợ năng): sao không lấp lánh, Kén không trôi.

## Còn lại cho chủ dự án

- **Âm thanh thật có bản quyền** (thay bản tạm do máy tạo). Đây vẫn là thứ ảnh hưởng nhiều nhất đến cảm nhận chất lượng.
- **Giọng hướng dẫn** cho bài thở và bài tập. Cần thu âm giọng thật, nên mình chưa làm.
- Nếu muốn icon chuyên nghiệp hơn, thuê designer vẽ lại dựa trên ý tưởng "kén treo dưới trăng".
