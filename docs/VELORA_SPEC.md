# ĐẶC TẢ QUY TRÌNH THUÊ XE & KIẾN TRÚC NGHIỆP VỤ VELORA (REFACTOR SPECIFICATION)

Dưới đây là quy trình thuê xe khép kín giữa **Khách hàng** và **Admin/Staff** trên hệ thống VELORA, tập trung vào hành động theo từng bước, chuyển đổi trạng thái và các ràng buộc nghiệp vụ đi kèm.

1. **Tạo yêu cầu đặt xe:**
**Vai trò:** Khách hàng

**Hành động:** Chọn xe, chọn khung giờ nhận/trả (`start_time`, `end_time`), hình thức nhận xe (tại bãi hoặc giao tận nơi) và 1 trong 3 chế độ đặt xe (Tiêu chuẩn cọc tiền mặt, Tiêu chuẩn trả trước VietQR giảm 5%, hoặc Fast Hold 500k).

**Trạng thái:**

* `RentalRequest`: Tạo mới `PENDING` (hoặc `PENDING_HOLD_PAYMENT` nếu chọn Fast Hold 500k).
* `Car`: Giữ nguyên `READY` (chưa khóa xe cho đến khi nộp cọc giữ chỗ hoặc được duyệt).

**Ràng buộc:**

* Tài khoản khách hàng phải có `is_active = true`.
* `start_time` phải lớn hơn thời điểm hiện tại và `end_time` phải lớn hơn `start_time`.
* Không được trùng khoảng thời gian (`Exclusion Constraint`) với các đơn thuê khác của cùng xe đang ở trạng thái khác `CANCELLED` và `REJECTED`.
* Thỏa mãn `rental_conditions`: GPLX hạng B1 không được thuê xe `MANUAL` (số sàn); không vượt quá quy định số chỗ; xe phân khúc sang kiểm tra thêm điều kiện tuổi và lịch sử thuê.


2. **Nộp cọc giữ chỗ và bổ sung giấy tờ:** Chỉ áp dụng cho Fast Hold 500k - Giới hạn trong 4 giờ.
**Vai trò:** Khách hàng & Hệ thống (Webhook / Background Worker)

**Hành động:** Khách quét mã VietQR chuyển 500.000đ giữ xe và tải lên ảnh CCCD + GPLX trước thời điểm `hold_expires_at`.

**Trạng thái:**

* Khi nộp đủ 500.000đ: `Payment` → `PAID`, `RentalRequest` → `HOLD_CONFIRMED`, `Car` → `BOOKED`.
* Nếu quá 4 giờ chưa nộp tiền hoặc chưa đủ giấy tờ: Hệ thống tự động chuyển `RentalRequest` → `CANCELLED` (hết hạn giữ chỗ), `Car` → `READY`.

**Ràng buộc:**

* Giao dịch VietQR phải xác thực chữ ký HMAC-SHA256 từ Webhook và kiểm tra duy nhất `transaction_code` để không ghi nhận trùng.
* Không thể chuyển sang bước duyệt nếu đơn Fast Hold chưa bổ sung đủ CCCD và GPLX.


3. **Thẩm định hồ sơ và phê duyệt đơn:**
**Vai trò:** Admin / Staff

**Hành động:** Kiểm tra giấy tờ KYC (CCCD, GPLX), điểm tín nhiệm, lịch sử vi phạm và hiện trạng xe; chọn **Phê duyệt** hoặc **Từ chối** kèm lý do.

**Trạng thái:**

* **Phê duyệt:** `RentalRequest` → `APPROVED`; tự động sinh `RentalContract` ở trạng thái `PENDING_SIGNATURE`; `Car` → `BOOKED`.
* **Từ chối:** `RentalRequest` → `REJECTED`; `Car` → `READY` (tạo phiếu hoàn lại 500k nếu khách đã nộp cọc giữ chỗ).

**Ràng buộc:**

* Yêu cầu quyền `Operations` (`ADMIN`, `MANAGER`, `STAFF`).
* Chỉ duyệt được đơn đang ở trạng thái `PENDING` hoặc `HOLD_CONFIRMED`.
* Toàn bộ thao tác đổi trạng thái đơn, khóa xe sang `BOOKED` và tạo bản ghi hợp đồng phải chạy trong cùng một Database Transaction.


4. **Ký hợp đồng điện tử và nộp cọc thế chân:**
**Vai trò:** Khách hàng (và Staff nếu thu cọc tiền mặt)

**Hành động:** Khách kiểm tra điều khoản hợp đồng đã điền đủ thông tin thực tế, ký điện tử trên `SignaturePad` và thanh toán tiền thuê/cọc thế chân qua VietQR (luồng cọc tiền mặt sẽ thanh toán trực tiếp ở bước 6).

**Trạng thái:**

* Khi khách ký xong: `RentalContract` → `SIGNED`.
* Khi hoàn tất cọc thế chân (qua Webhook VietQR): `Payment` → `PAID`, `RentalContract` → `DEPOSIT_PAID`, `RentalRequest` → `CONFIRMED`.

**Ràng buộc:**

* Chỉ chính chủ đơn thuê (`UserId` khớp JWT) mới có quyền ký hợp đồng; chữ ký không được rỗng.
* Không thể xác nhận `DEPOSIT_PAID` nếu hợp đồng chưa `SIGNED`.
* Nếu khách hủy đơn trước khi bàn giao xe: `RentalRequest` → `CANCELLED`, `RentalContract` → `VOID`, `Car` → `READY`.


5. **Xuất bãi trung chuyển xe:** Chỉ áp dụng khi giao xe tận nơi - Nhận tại bãi bỏ qua bước này.
**Vai trò:** Staff

**Hành động:** Trước khi lái xe từ bãi đến điểm hẹn, Staff tạo bản nháp biên bản bàn giao (`HandoverProtocol`), ghi nhận ODO xuất bãi (`dispatch_odo`), mức xăng/pin tại bãi và hiện trạng thân vỏ ban đầu.

**Trạng thái:**

* `HandoverProtocol`: Tạo mới ở trạng thái `IN_TRANSIT`.
* `Car`: Giữ nguyên `BOOKED`.

**Ràng buộc:**

* Hợp đồng phải đang ở trạng thái `SIGNED` (hoặc `DEPOSIT_PAID` đối với luồng trả trước VietQR).
* `dispatch_odo` phải lớn hơn hoặc bằng `cars.current_odo`.


6. **Bàn giao xe và ký xác nhận kép:**
**Vai trò:** Staff & Khách hàng

**Hành động:** Tại điểm giao xe, Staff cùng khách chốt ODO thực tế lúc giao (`handover_odo`), mức xăng/pin hiện tại, kiểm kê phụ kiện, chấm các vết xước sẵn có trên sơ đồ 2D và chụp ảnh đối chứng. Nếu khách chọn luồng tiền mặt, Staff thu cọc thế chân tại chỗ. Cuối cùng cả Staff và Khách ký xác nhận kép lên biên bản.

**Trạng thái:**

* `HandoverProtocol` → `COMPLETED`.
* `RentalRequest` → `ACTIVE`; `RentalContract` → `ACTIVE`; `Car` → `RENTED`.

**Ràng buộc:**

* Bắt buộc đủ 2 chữ ký (Staff và Khách hàng) và đã xác nhận thu đủ tiền cọc thế chân.
* `handover_odo` phải lớn hơn hoặc bằng `dispatch_odo` (nếu giao tận nơi) hoặc `cars.current_odo` (nếu nhận tại bãi).
* Nếu hiệu số `handover_odo - dispatch_odo` vượt ngưỡng cho phép (ví dụ lớn hơn 50 km hoặc 1,3 lần khoảng cách ước tính), hệ thống gắn cờ cảnh báo kiểm tra nội bộ cho Manager.
* Mức xăng/pin và sơ đồ xước ký với khách bắt buộc ghi nhận đúng thực tế tại mốc `handover_odo`, không lấy số cũ lúc xuất bãi.


7. **Xử lý gia hạn hoặc sự cố phát sinh:** Nhánh tùy chọn trong lúc đang thuê - Chuyển thẳng bước 8 nếu không phát sinh.
**Vai trò:** Khách hàng & Admin / Staff

**Hành động:**

* **Gia hạn (`RentalExtension`):** Khách gửi yêu cầu kéo dài thời gian trả → Staff duyệt/từ chối → Nếu duyệt, cập nhật `end_time` mới và cộng phụ phí.
* **Sự cố (`IncidentReport`):** Khách báo va chạm/hỏng hóc kèm ảnh và vị trí → Staff xử lý, có thể điều phối xe thay thế (`replacement_car_id`) và ghi nhận phân bổ chi phí giữa Bảo hiểm, VELORA và Khách.

**Trạng thái:**

* `RentalRequest` và `RentalContract` giữ `ACTIVE`.
* Nếu đổi xe thay thế: Xe gặp sự cố → `REPAIR`; xe thay thế → `RENTED`.

**Ràng buộc:**

* Chỉ tạo được yêu cầu gia hạn hoặc báo sự cố khi đơn đang ở trạng thái `ACTIVE`.
* Duyệt gia hạn bắt buộc kiểm tra không trùng lịch đặt trước của xe trong khung giờ mở rộng.


8. **Nghiệm thu nhận lại xe và đưa xe về bãi:**
**Vai trò:** Staff & Khách hàng

**Hành động:**

* Gặp khách thu xe: Staff lập Biên bản trả xe (`ReturnProtocol`), ghi nhận ODO khách trả (`customer_return_odo`), mức xăng/pin lúc trả, giờ trả thực tế, đánh dấu các vết xước/móp **mới** phát sinh trên sơ đồ 2D (so với `HandoverProtocol`) và ký xác nhận với khách.
* Nếu nhận xe tận nơi: Khi Staff lái xe về tới bãi, cập nhật thêm ODO về bãi (`yard_checkin_odo`) để đồng bộ vào `cars.current_odo`.

**Trạng thái:**

* `ReturnProtocol` → `COMPLETED`.
* `RentalRequest` → `RETURNED`.
* `Car` → `INSPECTION` (hoặc chuyển thẳng `REPAIR` nếu xe bị hư hỏng nặng cần sửa chữa).

**Ràng buộc:**

* Đơn phải đang ở trạng thái `ACTIVE`; mỗi hợp đồng chỉ có duy nhất 1 `ReturnProtocol`.
* `customer_return_odo` phải lớn hơn hoặc bằng `handover_odo`; `yard_checkin_odo` (nếu có) phải lớn hơn hoặc bằng `customer_return_odo`.
* Quãng đường sử dụng của khách bắt buộc tính theo `customer_return_odo - handover_odo` (loại trừ hoàn toàn quãng đường trung chuyển).


9. **Lập quyết toán, khấu trừ và giữ quỹ phạt nguội:**
**Vai trò:** Admin / Staff & Khách hàng

**Hành động:** Staff chạy dự toán (`preview`) và tạo Hồ sơ Quyết toán (`RentalSettlement`) tính tổng phụ phí (vượt km, trễ giờ, thiếu xăng, bồi thường vết xước mới theo `compensation_policies`), trừ vào tiền cọc và **tạm giữ 2.000.000đ quỹ phạt nguội**.

* Nếu khách đồng ý: Staff hoàn trả phần cọc dư qua VietQR (`confirm-refund`) hoặc xác nhận khách đã nộp bổ sung nếu chi phí vượt cọc (`confirm-additional-payment`).
* Nếu khách không đồng ý: Khách gửi khiếu nại (`dispute`) → Manager rà soát và chốt lại số tiền (`resolve-dispute`).

**Trạng thái:**

* `RentalSettlement`: `PENDING` → `DISPUTED` (nếu có khiếu nại) → `PARTIALLY_SETTLED` (đã thanh toán/hoàn phần chính, chỉ còn treo 2 triệu phạt nguội).
* `Car`: Chuyển từ `INSPECTION` → `READY` (nếu không cần bảo dưỡng/sửa chữa).
* `RentalRequest`: `SETTLED` (chờ tất toán phạt nguội).

**Ràng buộc:**

* Bắt buộc phải có `ReturnProtocol` ở trạng thái `COMPLETED` trước khi tạo quyết toán.
* Sau khi `RentalSettlement` đã chốt, khóa không cho chỉnh sửa ngược `ReturnProtocol` và `HandoverProtocol`.
* Chỉ chính chủ đơn mới được gửi `dispute`; chỉ `Operations` mới được giải quyết tranh chấp và xác nhận hoàn/thu tiền.


10. **Hoàn trả quỹ phạt nguội và đóng hồ sơ:** Thực hiện sau 15 đến 30 ngày kể từ ngày quyết toán.
**Vai trò:** Hệ thống (nhắc lịch) & Admin / Staff

**Hành động:** Đến hạn kiểm tra phạt nguội (15–30 ngày), Background Worker nhắc Staff tra cứu biển số xe trong thời gian khách thuê. Nếu không có vi phạm, Staff chuyển khoản trả nốt 2.000.000đ và xác nhận (`confirm-traffic-fine-refund`); nếu có phạt nguội thì khấu trừ và hoàn phần chênh lệch (nếu còn).

**Trạng thái:**

* `RentalSettlement` → `CLOSED`.
* `RentalContract` → `COMPLETED`; `RentalRequest` → `COMPLETED`.

**Ràng buộc:**

* Chỉ được xác nhận hoàn quỹ phạt nguội 1 lần duy nhất (`Idempotent`).
* Tổng số tiền hoàn lại không được lớn hơn số tiền quỹ phạt nguội đang tạm giữ.


---

### Bảng tổng hợp chuyển đổi trạng thái đồng bộ (State Machine)

| Giai đoạn | `RentalRequest` | `RentalContract` | `Car` |
| --- | --- | --- | --- |
| **1. Tạo đơn tiêu chuẩn** | `PENDING` | *(chưa tạo)* | `READY` |
| **2. Fast Hold 500k đã nộp cọc** | `HOLD_CONFIRMED` | *(chưa tạo)* | `BOOKED` |
| **3. Admin/Staff duyệt đơn** | `APPROVED` | `PENDING_SIGNATURE` | `BOOKED` |
| **4. Khách ký & nộp cọc đủ** | `CONFIRMED` | `SIGNED` → `DEPOSIT_PAID` | `BOOKED` |
| **5. Xuất bãi giao tận nơi** | `CONFIRMED` | `DEPOSIT_PAID` | `BOOKED` |
| **6. Ký biên bản giao xe kép** | `ACTIVE` | `ACTIVE` | `RENTED` |
| **8. Ký biên bản trả xe** | `RETURNED` | `ACTIVE` | `INSPECTION` *(hoặc `REPAIR`)* |
| **9. Chốt quyết toán cọc chính** | `SETTLED` | `ACTIVE` *(chờ phạt nguội)* | `READY` *(nếu xe bình thường)* |
| **10. Hoàn quỹ phạt nguội 2tr** | `COMPLETED` | `COMPLETED` | `READY` |
| **Nhánh thoát: Hủy / Từ chối / Hết hạn 4h** | `CANCELLED` / `REJECTED` | `VOID` *(nếu đã tạo)* | `READY` |


3. Ba bẫy nghiệp vụ cần xử lý đi kèm
Hao hụt nhiên liệu: Chạy 30 km có thể làm tụt nhẹ vạch xăng hoặc giảm ~5% pin (với xe điện). Biên bản ký với khách phải ghi nhận mức xăng/pin thực tế tại mốc 1030 km, tránh trường hợp lúc xuất bãi là 100%, đến nơi còn 92% nhưng vẫn ghi 100% khiến khách bị phạt oan lúc trả xe.
Trách nhiệm trầy xước (Sơ đồ 2D): Nếu nhân viên lỡ quẹt xe trong 30 km di chuyển từ bãi đến điểm hẹn, đó là trách nhiệm nội bộ. Hệ thống nên ghi nhận sơ đồ xước 2D xác nhận với khách tại điểm bàn giao (1030 km); nếu phát sinh vết xước mới so với lúc rời bãi (1000 km), quản lý sẽ tách ra thành sự cố nội bộ (incident_reports) chứ không tính cho khách.
Cảnh báo bất thường (Audit nội bộ): Nhờ lưu cả hai mốc, bạn có thể viết một rule cảnh báo đơn giản cho Admin: nếu handover_odo - dispatch_odo vượt quá một ngưỡng hợp lý (ví dụ lớn hơn 1,3 lần khoảng cách từ bãi đến địa chỉ giao xe hoặc lớn hơn 50 km), hệ thống gắn cờ cảnh báo để Manager kiểm tra xem nhân viên có nhập nhầm số ODO hay dùng xe sai mục đích hay không.

Nguyên tắc cốt lõi để xử lý cả 3 bẫy này trong VELORA là tách bạch rạch ròi giữa dữ liệu pháp lý ký với khách hàng và dữ liệu kiểm soát nội bộ, đồng thời đảm bảo các rule kiểm tra nội bộ không bao giờ làm kẹt quy trình giao xe ngoài thực địa.

Dưới đây là cách thiết kế cụ thể từ Database, Backend đến UI cho từng bẫy.

1. Xử lý bẫy hao hụt nhiên liệu / pin
Thay vì lưu 1 cột mức nhiên liệu duy nhất, tách đôi thành mốc Xuất/Nhập bãi và mốc Giao/Nhận khách tương tự như ODO.

Cập nhật Schema:
handover_protocols: thêm dispatch_fuel_level (decimal, nullable — lúc rời bãi) và handover_fuel_level (decimal, required — lúc gặp khách), kèm handover_dash_photo_url (bắt buộc chụp đồng hồ taplo lúc giao).
return_protocols: thêm customer_return_fuel_level (decimal, required — lúc thu xe từ khách) và yard_checkin_fuel_level (decimal, nullable — lúc xe về bãi).
Chuẩn hóa đơn vị đo theo cars.fuel_type:
ELECTRIC: nhập trực tiếp % pin thực tế (0–100%).
PETROL / DIESEL: trên UI cho chọn theo thang 8 vạch (mỗi vạch tương đương 12.5%) để Staff và khách dễ thống nhất bằng mắt thường, tránh tranh cãi giữa "92%" và "95%".
Logic tính phí trong SettlementService (có dung sai):
Chỉ tính trên cặp khách hàng: deficit = handover_fuel_level - customer_return_fuel_level.
Áp dụng ngưỡng dung sai (Tolerance) cấu hình trong system_settings (ví dụ: 3% cho xe điện hoặc nửa vạch cho xe xăng). Nếu deficit <= tolerance thì miễn phí bù xăng vì cảm biến phao xăng dễ lệch theo độ dốc mặt đường.
Kiểm soát nội bộ: Backend tự tính transit_fuel_drop = dispatch_fuel_level - handover_fuel_level. Nếu chênh lệch vượt mức tiêu thụ hợp lý của 30 km (ví dụ tụt trên 15% bình xăng), hệ thống gắn cờ cảnh báo cho Manager kiểm tra rò rỉ hoặc gian lận nhiên liệu.
2. Xử lý bẫy trầy xước trên Sơ đồ 2D (VehicleDamageMapCanvas)
Để tách biệt vết xước cũ, vết do Staff đi giao quẹt phải và vết do khách gây ra, cần nâng cấp cấu trúc dữ liệu điểm đánh dấu (marker) trên sơ đồ 2D theo cơ chế diff theo từng giai đoạn.

Cấu trúc JSON cho mỗi marker lưu trong DB:
JSON
{
"id": "dmg-uuid-01",
"x": 0.42,
"y": 0.78,
"part": "FRONT_LEFT_BUMPER",
"severity": "LIGHT_SCRATCH",
"stage": "PRE_EXISTING | TRANSIT_DELIVERY | CUSTOMER_RENTAL | TRANSIT_RETURN",
"photo_url": "sensitive-docs/damages/dmg-uuid-01.jpg",
"created_by": "staff_id"
}
Luồng xử lý qua 3 mốc thời gian:
Lúc rời bãi (IN_TRANSIT): dispatch_damage_map tự động kế thừa toàn bộ vết chưa sửa của xe từ lần trả trước (stage = PRE_EXISTING). Staff kiểm tra nhanh quanh xe rồi bấm xác nhận rời bãi.
Lúc giao cho khách (COMPLETED): handover_damage_map hiển thị sẵn các vết từ dispatch_damage_map dưới dạng chỉ đọc (khóa không cho xóa).
Nếu lúc gặp khách phát hiện thêm vết xước mới mà khi rời bãi chưa có, Staff vẫn phải chấm lên sơ đồ và chụp ảnh để khách yên tâm ký nhận (đảm bảo khách không bị đền oan lúc trả).
Khi gọi API lưu biên bản, Backend so sánh danh sách id giữa handover_damage_map và dispatch_damage_map. Mọi marker mới phát sinh ở bước này được tự động gắn stage = TRANSIT_DELIVERY.
Ngay trong cùng Transaction, Backend tự động tạo 1 bản ghi trong incident_reports với incident_type = INTERNAL_TRANSIT, responsible_party = STAFF, customer_cost = 0 và gửi thông báo về Dashboard để Manager xử lý nội bộ với nhân viên giao xe.
Lúc nhận lại xe (ReturnProtocol): Sơ đồ khóa toàn bộ các vết đã chốt trong handover_damage_map (bao gồm cả PRE_EXISTING và TRANSIT_DELIVERY). Chỉ những marker mới chấm thêm ở bước này (stage = CUSTOMER_RENTAL) mới được đẩy sang SettlementService để tra bảng compensation_policies và khấu trừ tiền cọc của khách.
3. Xử lý bẫy cảnh báo bất thường (Audit nội bộ)
Điểm dễ sai khi làm tính năng Audit là đặt luật chặn cứng khiến Staff đứng ngoài đường không giao được xe cho khách khi bị kẹt xe phải đi đường vòng. Vì vậy cần chia rõ 2 cấp độ xử lý:
Chuẩn bị ngưỡng so sánh:
Khi tạo đơn giao tận nơi, lưu estimated_delivery_distance_km (khoảng cách dự kiến từ bãi đến điểm hẹn).
Công thức ngưỡng hợp lý cho quãng đường trung chuyển transit_km = handover_odo - dispatch_odo:
Nếu có khoảng cách ước tính: max_allowed_km = (estimated_delivery_distance_km * 1.3) + 5 (dự phòng 30% đi vòng tránh kẹt xe + 5 km tìm chỗ đậu).
Nếu chưa tích hợp tính khoảng cách: lấy ngưỡng mặc định từ system_settings (ví dụ MaxDefaultTransitKm = 50).
Ma trận xử lý 2 cấp độ trong HandoverProtocolService:

| Trường hợp | Điều kiện phát hiện | Hành vi hệ thống | Mục đích |
| --- | --- | --- | --- |
| Hard Block (Chặn lưu) | handover_odo < dispatch_odo hoặc transit_km > max_allowed_km * 3 (hoặc > 300 km nội thành) | Trả về HTTP 400, yêu cầu Staff kiểm tra lại số ODO và đối chiếu ảnh đồng hồ taplo. | Ngăn lỗi nhập liệu phổ biến (gõ thiếu hoặc thừa 1 chữ số 0, ví dụ 1000 thành 10300). |
| Soft Flag (Cảnh báo mềm) | transit_km > max_allowed_km nhưng vẫn nằm trong ngưỡng khả thi | Vẫn cho phép giao xe và ký hợp đồng bình thường, nhưng UI hiện ô bắt buộc nhập lý do (transit_anomaly_note), lưu has_transit_anomaly = true và đẩy cảnh báo lên trang quản trị. | Không làm trễ lịch của khách hàng, đồng thời lưu đủ bằng chứng (ảnh ODO + giải trình) để Manager hậu kiểm nhân viên sau. |

Áp dụng đối xứng cho chiều về: Khi Staff nhận xe tại nhà khách (customer_return_odo = 1430) rồi lái về bãi (yard_checkin_odo = 1460), áp dụng y hệt bộ rule trên cho hiệu số yard_checkin_odo - customer_return_odo và kiểm tra vết xước TRANSIT_RETURN lúc xe vào bãi để khép kín vòng kiểm soát nội bộ 2 chiều.


Chia lại role của phần Admin/staff
Với quy mô và cấu trúc menu hiện tại của VELORA Backoffice Portal, trang admin nên chia làm 3 role nội bộ: STAFF, MANAGER và ADMIN.

Nhìn ngay vào màn hình hiện tại, tài khoản đang đăng nhập là STAFF nhưng vẫn xem được toàn bộ Tổng doanh thu (76.457.041 đ) và truy cập nhóm Cấu hình chính sách (Bảng giá, Điều kiện thuê, Biểu phí bồi thường, Mẫu hợp đồng). Trong vận hành thực tế, đây là rủi ro lớn về bảo mật kinh doanh và kiểm soát chéo (nhân viên giao xe có thể tự sửa đơn giá hoặc biểu phí phạt trước khi lập quyết toán).

Ma trận phân quyền đề xuất cho 3 role Backoffice
Cách chia 3 role bám sát 4 nhóm menu đã có sẵn trên thanh bên và khớp với phần phân quyền Backend cần chuẩn hóa:


| Nhóm chức năng (theo Sidebar) | STAFF (Nhân viên vận hành) | MANAGER (Quản lý vận hành) | ADMIN (Chủ hệ thống) |
| --- | --- | --- | --- |
| Tổng quan (Dashboard & Hiệu suất) | Chỉ xem thẻ vận hành (đơn chờ duyệt, xe sẵn sàng, xe trả trễ) — ẩn doanh thu | Xem đầy đủ doanh thu, biểu đồ, hiệu suất khai thác đội xe | Toàn quyền |
| Vận hành đơn thuê (Duyệt đơn, Bàn giao, Hoàn trả, Gia hạn, Sự cố) | Thao tác chính hằng ngày (tạo/ký biên bản, duyệt đơn, ghi nhận sự cố) | Toàn quyền + hậu kiểm cảnh báo ODO/xước trung chuyển và xử lý sự cố lớn | Toàn quyền |
| Quản lý khách hàng | Xem thông tin liên hệ, hồ sơ KYC để đối chiếu giao xe | Duyệt/từ chối KYC, ghi nhận vi phạm, khóa/mở khóa tài khoản | Toàn quyền |
| Quyết toán & Hoàn cọc | Lập bản nháp dự toán (preview) và tạo bảng kê | Xác nhận hoàn cọc, hoàn quỹ phạt nguội 2tr, giải quyết khiếu nại (resolve-dispute) | Toàn quyền |
| Quản lý đội xe (Danh sách xe, Bảo dưỡng, Bảo hiểm) | Chỉ xem danh sách xe, cập nhật trạng thái bảo dưỡng | Thêm/sửa/ngưng xe, quản lý hồ sơ bảo hiểm | Toàn quyền + xóa xe |
| Cấu hình chính sách (Bảng giá, Điều kiện, Biểu phí, Mẫu hợp đồng) | Ẩn hoàn toàn trên menu | Chỉnh sửa Bảng giá & Chiết khấu, Điều kiện thuê xe | Toàn quyền + sửa Biểu phí bồi thường, Mẫu hợp đồng |
| Hệ thống & Nhân sự (/admin/settings, tài khoản nội bộ, Audit Log) | Ẩn | Ẩn (chỉ xem danh sách nhân viên cấp dưới) | Toàn quyền (tạo/khóa tài khoản Staff/Manager, cấu hình hệ thống) |

Vì sao nên dừng ở 3 role (không quá ít, không quá nhiều)?
Tách được người làm và người duyệt (Kiểm soát chéo): STAFF là người trực tiếp cầm xe đi giao/nhận và lập biên bản, còn MANAGER là người hậu kiểm cảnh báo lệch ODO trung chuyển, duyệt giải quyết khiếu nại và bấm xác nhận chuyển tiền hoàn cọc. Nếu chỉ có 1 role chung, nhân viên có thể tự tạo lỗi và tự duyệt xóa dấu vết.
Không bị phân mảnh quá mức: Với đội xe khoảng 27–30 chiếc hiện tại, tách thêm các role như Kế toán (Accountant), Chăm sóc khách hàng (CSKH) hay Tài xế giao xe (Driver) sẽ gây cồng kềnh khi vận hành và dư thừa màn hình. Bạn chỉ cần tách thêm role Kế toán (chuyên trách Payments, Settlements, hoàn phạt nguội và đối soát Webhook) khi đội xe vượt mốc ~100 xe hoặc có bộ phận tài chính độc lập.
Khớp sẵn với thiết kế hệ thống: Mô hình 3 role nội bộ (STAFF, MANAGER, ADMIN) + 2 nhóm bên ngoài (GUEST, CUSTOMER) khớp trực tiếp với 3 Policy đã đề xuất ở Backend (CustomerOrStaff, Operations, Management) và xử lý luôn lỗi bất đối xứng của vai trò MANAGER trong báo cáo rà soát trước đó.
Lưu ý nhỏ khi triển khai UI: Bên cạnh việc chặn ở Backend API bằng Policy, ở Frontend React bạn chỉ cần ẩn hẳn mục Cấu hình chính sách và chuyển Dashboard của STAFF sang phiên bản Bảng điều phối vận hành (chỉ giữ lại các chỉ số xe sẵn sàng, đơn chờ duyệt, trả trễ, sự cố — bỏ thẻ Tổng doanh thu và biểu đồ doanh thu 6 tháng).

(Ngoài lề một chi tiết nhỏ thấy trên màn hình: số liệu đội xe đang lệch nhẹ giữa Sidebar Danh sách xe (27), thẻ Cơ cấu trạng thái (27 phương tiện) với thẻ Xe sẵn sàng giao (13/28 xe) và Tỷ lệ khai thác 53.6% (3/28 xe lăn bánh) — bạn nên kiểm tra lại điều kiện lọc is_active và công thức tính phần trăm trong AnalyticsService để các con số trên Dashboard khớp nhau hoàn toàn.)

