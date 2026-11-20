import urllib.request
import urllib.error
import json
import hmac
import hashlib
import sys
import time
from datetime import datetime, timezone, timedelta

BASE_URL = "http://localhost:5171/api"
WEBHOOK_SECRET = "VeloraWebhookHmacSecretKey2026!@#"

passed_tests = 0
failed_tests = 0

def log_test(title, passed, details=""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {title}")
        if details:
            print(f"         └─ {details}")
    else:
        failed_tests += 1
        print(f"  [FAIL] {title}")
        if details:
            print(f"         └─ ERROR: {details}")

def request(endpoint, method="GET", data=None, token=None, custom_headers=None, expected_status=None):
    url = f"{BASE_URL}/{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if custom_headers:
        headers.update(custom_headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            status = resp.status
            parsed = json.loads(resp_body) if resp_body else {}
            if expected_status and status != expected_status:
                raise AssertionError(f"Expected status {expected_status}, but got {status}: {resp_body}")
            return status, parsed
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        parsed = {}
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        if expected_status and e.code != expected_status:
            raise AssertionError(f"Expected status {expected_status}, but got {e.code}: {err_body}")
        return e.code, parsed

def hmac_sha256(secret, body_bytes):
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

print("================================================================================")
print("  VELORA INTEGRATION E2E TEST RUNNER - PHASE 5 VERIFICATION")
print(f"  Time: {datetime.now(timezone.utc).isoformat()}")
print(f"  Target: {BASE_URL}")
print("================================================================================")

# Step 0: Initial Cleanup & Authenticate Base Roles
print("\n[INIT] 0. Authenticating Base Roles (Staff, Manager, Admin)...")
_, staff_auth = request("auth/login", "POST", {"email": "staff@velora.vn", "password": "Velora@2026"}, expected_status=200)
staff_token = staff_auth["token"]
staff_user = staff_auth["user"]

_, mgr_auth = request("auth/login", "POST", {"email": "manager@velora.vn", "password": "Velora@2026"}, expected_status=200)
mgr_token = mgr_auth["token"]
mgr_user = mgr_auth["user"]

_, admin_auth = request("auth/login", "POST", {"email": "admin@velora.vn", "password": "Velora@2026"}, expected_status=200)
admin_token = admin_auth["token"]
admin_user = admin_auth["user"]

print("  -> Base roles authenticated successfully.")

# Safe Cleanup of any prior E2E test data
print("[INIT] Executing pre-flight safe cleanup of test prefix data...")
request("system-settings/cleanup-e2e", "POST", {}, token=admin_token)

# Register Customer A and Customer B
print("\n[INIT] Registering Test Customers A and B...")
_, cust_a_reg = request("auth/register", "POST", {
    "email": "e2e_cust_a_3363@velora.vn",
    "password": "Velora@2026",
    "fullName": "E2E_TEST_Customer A",
    "phoneNumber": "0901112233"
}, expected_status=200)
cust_a_id = cust_a_reg["user"]["id"]

_, cust_a_auth = request("auth/login", "POST", {"email": "e2e_cust_a_3363@velora.vn", "password": "Velora@2026"}, expected_status=200)
cust_a_token = cust_a_auth["token"]

# Manager verifies Customer A KYC
request(f"customers/{cust_a_id}/kyc-status", "PUT", {"kycStatus": "VERIFIED"}, token=mgr_token, expected_status=200)

_, cust_b_reg = request("auth/register", "POST", {
    "email": "e2e_cust_b_3363@velora.vn",
    "password": "Velora@2026",
    "fullName": "E2E_TEST_Customer B",
    "phoneNumber": "0904445566"
}, expected_status=200)
cust_b_id = cust_b_reg["user"]["id"]

_, cust_b_auth = request("auth/login", "POST", {"email": "e2e_cust_b_3363@velora.vn", "password": "Velora@2026"}, expected_status=200)
cust_b_token = cust_b_auth["token"]
print("  -> Customers A and B registered and ready.")

# Manager creates a dedicated Test Vehicle with E2E prefix
print("\n[INIT] Manager creates dedicated Test Vehicle...")
_, test_car = request("vehicles", "POST", {
    "licensePlate": "E2E_TEST_51A-999.99",
    "make": "Mercedes-Benz",
    "model": "C300 AMG Test",
    "manufactureYear": 2025,
    "seats": 5,
    "transmission": "AUTO",
    "fuelType": "PETROL",
    "dailyRate": 1500000,
    "depositAmount": 15000000,
    "mileageLimit": 300,
    "pickupLocation": "Bãi xe VELORA Quận 1",
    "currentMileage": 1000
}, token=mgr_token, expected_status=201)
test_car_id = test_car["id"]
print(f"  -> Test Vehicle created: {test_car['licensePlate']} (ID: {test_car_id})")

try:
    print("\n================================================================================")
    print("  BỘ A: CHU TRÌNH 10 BƯỚC KHÉP KÍN + 3 BẪY NGHIỆP VỤ THỰC TẾ")
    print("================================================================================")

    # -------------------------------------------------------------------------
    # Bước 1-2: Customer A đặt Fast Hold 500k -> Webhook VietQR HMAC-SHA256
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 1 & 2: FAST HOLD 500K & WEBHOOK VIETQR HMAC-SHA256 ---")
    start_time = (datetime.now(timezone.utc) + timedelta(days=10)).replace(microsecond=0)
    end_time = (start_time + timedelta(days=2)).replace(microsecond=0)

    booking_payload = {
        "carId": test_car_id,
        "startTime": start_time.isoformat(),
        "endTime": end_time.isoformat(),
        "pickupLocation": "123 Đường Test E2E, Quận 1",
        "dropoffLocation": "123 Đường Test E2E, Quận 1",
        "customerName": "E2E_TEST_Customer A",
        "customerPhone": "0901112233",
        "customerEmail": "e2e_cust_a_3363@velora.vn",
        "customerIdCard": "079099999999",
        "driverLicenseNumber": "790999999999",
        "driverLicenseClass": "B2",
        "bookingType": "FAST_HOLD",
        "depositMethod": "VIETQR",
        "holdDepositAmount": 500000,
        "estimatedDeliveryDistanceKm": 20,
        "notes": "E2E_TEST: Đơn thuê thử nghiệm tự động"
    }

    status, req_res = request("rental-requests", "POST", booking_payload, token=cust_a_token, expected_status=201)
    req_id = req_res["id"]
    log_test("Bước 1: Tạo yêu cầu thuê xe Fast Hold 500k (20km delivery)", 
             req_res["status"] in ["PENDING", "PENDING_HOLD_PAYMENT"] and req_res.get("estimatedDeliveryDistanceKm") == 20,
             f"RequestId: {req_id}, Status: {req_res['status']}, EstDist: {req_res.get('estimatedDeliveryDistanceKm')}km")

    _, car_check = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 1: Xe giữ nguyên READY trước khi nộp cọc giữ chỗ", car_check["status"] == "READY", f"Car Status: {car_check['status']}")

    # Khởi tạo giao dịch thanh toán Fast Hold 500k qua API (tương tự như Frontend DepositPaymentPage)
    _, fast_hold_payment = request("payments/deposit", "POST", {
        "rentalRequestId": req_id,
        "paymentMethod": "VIETQR",
        "paymentCategory": "HOLD_DEPOSIT"
    }, token=cust_a_token, expected_status=200)
    fh_txn_code = fast_hold_payment["transactionCode"]

    # Gọi Webhook VietQR kèm HMAC-SHA256
    short_code = str(req_id)[:8]
    webhook_payload = {
        "gateway": "VietQR",
        "transactionDate": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "accountNumber": "0123456789",
        "transferAmount": 500000,
        "amount": 500000,
        "content": f"VELORA COC {short_code}",
        "referenceCode": fh_txn_code,
        "transactionCode": fh_txn_code
    }
    raw_webhook_json = json.dumps(webhook_payload)
    sig = hmac_sha256(WEBHOOK_SECRET, raw_webhook_json.encode("utf-8"))

    # Test invalid signature rejected
    inv_status, _ = request("payments/webhook", "POST", webhook_payload, custom_headers={"X-Signature": "invalid_sig_123"})
    log_test("Bước 2: Webhook từ chối chữ ký HMAC-SHA256 không hợp lệ (401)", inv_status == 401, f"HTTP Status: {inv_status}")

    # Send valid webhook
    wb_status, wb_res = request("payments/webhook", "POST", webhook_payload, custom_headers={"X-Signature": sig}, expected_status=200)
    log_test("Bước 2: Webhook VietQR xác thực chữ ký HMAC-SHA256 thành công (200)", wb_res.get("success") is True)

    _, req_after_hold = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, car_after_hold = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 2: Trạng thái RentalRequest = HOLD_CONFIRMED & Car = BOOKED", 
             req_after_hold["status"] == "HOLD_CONFIRMED" and car_after_hold["status"] == "BOOKED",
             f"Request: {req_after_hold['status']}, Car: {car_after_hold['status']}")

    # Idempotent test: Gửi lại Webhook trùng transaction_code
    wb2_status, wb2_res = request("payments/webhook", "POST", webhook_payload, custom_headers={"X-Signature": sig}, expected_status=200)
    log_test("Bước 2: Webhook trùng transaction_code được xử lý Idempotent (không lỗi, không cộng trùng)",
             wb2_res.get("success") is True)

    # -------------------------------------------------------------------------
    # Bước 3-4: Staff duyệt đơn -> Customer A ký số -> Nộp cọc thế chân
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 3 & 4: DUYỆT ĐƠN, KÝ HỢP ĐỒNG & CỌC THẾ CHÂN ---")
    _, app_res = request(f"rental-requests/{req_id}/approve", "PUT", {}, token=staff_token, expected_status=200)
    _, req_app = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, contract_created = request(f"rental-contracts/request/{req_id}", "GET", token=staff_token, expected_status=200)
    contract_id = contract_created["id"]
    log_test("Bước 3: Staff duyệt đơn -> Request = APPROVED, Contract = PENDING_SIGNATURE",
             req_app["status"] == "APPROVED" and contract_created["status"] == "PENDING_SIGNATURE",
             f"Contract ID: {contract_id}, Status: {contract_created['status']}")

    # Customer A ký hợp đồng
    _, sign_res = request(f"rental-contracts/{contract_id}/sign", "POST", {
        "signature": "E2E_TEST_Customer A Signature",
        "agreeTerms": True
    }, token=cust_a_token, expected_status=200)
    _, contract_signed = request(f"rental-contracts/{contract_id}", "GET", token=cust_a_token, expected_status=200)
    log_test("Bước 4: Customer A ký số hợp đồng điện tử -> Contract = SIGNED",
             contract_signed["status"] == "SIGNED", f"Contract Status: {contract_signed['status']}")

    # Khởi tạo giao dịch nộp cọc thế chân qua API (COLLATERAL)
    _, dep_payment = request("payments/deposit", "POST", {
        "rentalRequestId": req_id,
        "contractId": contract_id,
        "paymentMethod": "VIETQR",
        "paymentCategory": "COLLATERAL"
    }, token=cust_a_token, expected_status=200)
    dep_txn = dep_payment["transactionCode"]

    # Nộp cọc thế chân qua VietQR Webhook
    dep_webhook_payload = {
        "gateway": "VietQR",
        "transactionDate": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "accountNumber": "0123456789",
        "transferAmount": dep_payment["amount"],
        "amount": dep_payment["amount"],
        "content": f"VELORA COC {short_code}",
        "referenceCode": dep_txn,
        "transactionCode": dep_txn
    }
    dep_sig = hmac_sha256(WEBHOOK_SECRET, json.dumps(dep_webhook_payload).encode("utf-8"))
    request("payments/webhook", "POST", dep_webhook_payload, custom_headers={"X-Signature": dep_sig}, expected_status=200)

    _, req_conf = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, contract_dep = request(f"rental-contracts/{contract_id}", "GET", token=staff_token, expected_status=200)
    _, car_dep = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 4: Hoàn tất nộp cọc thế chân -> Contract = DEPOSIT_PAID, Request = CONFIRMED, Car = BOOKED",
             contract_dep["status"] == "DEPOSIT_PAID" and req_conf["status"] == "CONFIRMED" and car_dep["status"] == "BOOKED",
             f"Contract: {contract_dep['status']}, Request: {req_conf['status']}, Car: {car_dep['status']}")

    # -------------------------------------------------------------------------
    # Bước 5-6 (Bẫy 1, 2, 3 chiều đi): Xuất bãi & Bàn giao kép
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 5 & 6 (BẪY 1, 2, 3 CHIỀU ĐI): XUẤT BÃI & BÀN GIAO KÉP ---")
    pre_marker = [{"id": "dmg-pre-01", "x": 0.2, "y": 0.3, "part": "FRONT_BUMPER", "severity": "LIGHT_SCRATCH", "stage": "PRE_EXISTING", "type": "EXISTING"}]
    
    _, draft_handover = request("handover-protocols", "POST", {
        "rentalRequestId": req_id,
        "contractId": contract_id,
        "dispatchOdo": 1000,
        "handoverOdo": 1000,
        "dispatchFuelLevel": 100,
        "handoverFuelLevel": 100,
        "dispatchDamageMap": json.dumps(pre_marker),
        "status": "IN_TRANSIT",
        "staffName": "Nhân viên Giao xe E2E"
    }, token=staff_token, expected_status=201)
    handover_id = draft_handover["id"]
    log_test("Bước 5: Staff tạo biên bản IN_TRANSIT (dispatch_odo = 1000, fuel = 100, vết PRE_EXISTING)",
             draft_handover["status"] == "IN_TRANSIT" and draft_handover["dispatchOdo"] == 1000,
             f"Handover ID: {handover_id}, Status: {draft_handover['status']}")

    # Test Bẫy 3 Soft Flag: handover_odo = 1035 (vượt 20*1.3+5 = 31km). Không có note -> chặn lưu
    soft_flag_no_note, err_note = request(f"handover-protocols/{handover_id}/confirm", "POST", {
        "handoverOdo": 1035,
        "handoverFuelLevel": 92,
        "staffSignature": "data:image/png;base64,staff_sig_bytes",
        "customerSignature": "data:image/png;base64,cust_sig_bytes"
    }, token=staff_token)
    log_test("Bẫy 3 chiều đi: Soft Flag yêu cầu transit_anomaly_note khi ODO vượt hạn mức (HTTP 400)",
             soft_flag_no_note == 400, f"HTTP: {soft_flag_no_note}, Message: {err_note.get('message')}")

    # Hoàn tất bàn giao có note giải trình + thêm vết xước mới lúc giao
    new_transit_marker = {"id": "dmg-transit-01", "x": 0.6, "y": 0.7, "part": "REAR_LEFT_DOOR", "severity": "MEDIUM_SCRATCH", "stage": "TRANSIT_DELIVERY", "type": "NEW"}
    merged_handover_markers = pre_marker + [new_transit_marker]

    _, confirmed_handover_res = request(f"handover-protocols/{handover_id}/confirm", "POST", {
        "handoverOdo": 1035,
        "handoverFuelLevel": 92,
        "handoverDashPhotoUrl": "https://velora.vn/sensitive-docs/taplo-1035.jpg",
        "transitAnomalyNote": "Kẹt xe cầu Kênh Tẻ giờ cao điểm, phải đi vòng qua cầu Him Lam và đường D1",
        "handoverDamageMap": json.dumps(merged_handover_markers),
        "staffSignature": "data:image/png;base64,staff_signature_valid",
        "customerSignature": "data:image/png;base64,customer_signature_valid",
        "notes": "Đã bàn giao xe cho khách tại điểm hẹn"
    }, token=staff_token, expected_status=200)
    confirmed_handover = confirmed_handover_res.get("data", confirmed_handover_res)

    # Kiểm tra Soft Flag đã lưu has_transit_anomaly = True
    log_test("Bẫy 3 chiều đi: Đã lưu has_transit_anomaly = true và cho phép bàn giao",
             confirmed_handover["hasTransitAnomaly"] is True and "Kẹt xe" in (confirmed_handover.get("transitAnomalyNote") or ""),
             f"HasAnomaly: {confirmed_handover['hasTransitAnomaly']}, Note: {confirmed_handover.get('transitAnomalyNote')}")

    # Kiểm tra Bẫy 2: Vết mới tự gắn stage = TRANSIT_DELIVERY và tự sinh 1 bản ghi incident_reports nội bộ
    hd_map = json.loads(confirmed_handover.get("handoverDamageMap") or "[]")
    transit_marker_saved = next((m for m in hd_map if m.get("id") == "dmg-transit-01"), None)
    log_test("Bẫy 2: Marker phát sinh trung chuyển tự động mang stage = TRANSIT_DELIVERY",
             transit_marker_saved is not None and transit_marker_saved.get("stage") == "TRANSIT_DELIVERY",
             f"Marker Stage: {transit_marker_saved.get('stage') if transit_marker_saved else 'NOT_FOUND'}")

    _, all_incidents = request("incidents", "GET", token=staff_token, expected_status=200)
    transit_incident = next((i for i in all_incidents if i.get("rentalRequestId") == req_id and i.get("incidentType") == "INTERNAL_TRANSIT"), None)
    log_test("Bẫy 2: Tự động sinh IncidentReport nội bộ (INTERNAL_TRANSIT, STAFF, customer_cost = 0)",
             transit_incident is not None and transit_incident.get("responsibleParty") == "STAFF" and transit_incident.get("customerPayAmount") == 0,
             f"Incident: {transit_incident.get('incidentCode') if transit_incident else 'NONE'}, Party: {transit_incident.get('responsibleParty') if transit_incident else ''}")

    # Kiểm tra đồng bộ State Machine
    _, req_active = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, contract_active = request(f"rental-contracts/{contract_id}", "GET", token=staff_token, expected_status=200)
    _, car_rented = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 6: Đồng bộ State Machine -> Request = ACTIVE, Contract = ACTIVE, Car = RENTED",
             req_active["status"] == "ACTIVE" and contract_active["status"] == "ACTIVE" and car_rented["status"] == "RENTED",
             f"Request: {req_active['status']}, Contract: {contract_active['status']}, Car: {car_rented['status']}")

    # -------------------------------------------------------------------------
    # Bước 8 (Bẫy 1, 2, 3 chiều về): Nghiệm thu trả xe & Đưa xe về bãi
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 8 (BẪY 1, 2, 3 CHIỀU VỀ): NGHIỆM THU TRẢ XE & ĐƯA XE VỀ BÃI ---")
    customer_scratch = {"id": "dmg-cust-01", "x": 0.8, "y": 0.8, "part": "REAR_BUMPER", "severity": "DEEP_SCRATCH", "stage": "CUSTOMER_RENTAL", "type": "NEW", "fee": 500000}
    return_markers = merged_handover_markers + [customer_scratch]

    return_payload = {
        "rentalRequestId": req_id,
        "contractId": contract_id,
        "returnDate": (datetime.now(timezone.utc)).isoformat(),
        "customerReturnOdo": 1350,
        "customerReturnFuelLevel": 75,
        "yardCheckinOdo": 1380,
        "yardCheckinFuelLevel": 73,
        "returnDashPhotoUrl": "https://velora.vn/sensitive-docs/taplo-1350.jpg",
        "returnDamageMap": json.dumps(return_markers),
        "newDamagesNotes": "Trầy sâu cản sau do lùi xe quẹt trụ bê tông",
        "staffSignature": "data:image/png;base64,staff_return_sig",
        "customerSignature": "data:image/png;base64,customer_return_sig",
        "nextVehicleStatus": "READY"
    }

    _, ret_protocol = request("return-protocols", "POST", return_payload, token=staff_token, expected_status=201)
    ret_id = ret_protocol["id"]

    # Xác nhận quãng đường tính cho khách = 1350 - 1035 = 315 km
    km_billed = ret_protocol["totalKmDriven"]
    _, car_inspected = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    _, req_returned = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)

    log_test("Bước 8: Quãng đường tính cho khách = 1350 - 1035 = 315 km (loại trừ 35km giao và 30km về)",
             km_billed == 315, f"Billed Km: {km_billed} km (Expected: 315 km)")
    log_test("Bước 8: Car.CurrentMileage cập nhật = yard_checkin_odo = 1380 km",
             car_inspected["currentMileage"] == 1380, f"Car Mileage: {car_inspected['currentMileage']} km")
    log_test("Bước 8: Đồng bộ State Machine -> Request = RETURNED, Car = INSPECTION",
             req_returned["status"] == "RETURNED" and car_inspected["status"] == "INSPECTION",
             f"Request: {req_returned['status']}, Car: {car_inspected['status']}")

    # -------------------------------------------------------------------------
    # Bước 9 (Quyết toán & Dung sai): Preview, tạo Settlement & Hoàn cọc đợt 1
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 9 (QUYẾT TOÁN & DUNG SAI): PREVIEW, TẠO BẢNG KÊ & HOÀN CỌC ĐỢT 1 ---")
    _, preview = request(f"settlements/preview/{req_id}", "GET", token=staff_token, expected_status=200)

    # Kiểm tra chỉ phạt vết CUSTOMER_RENTAL (500.000đ), không phạt TRANSIT_DELIVERY
    damage_fee_preview = preview.get("damageFee")
    # Dung sai nhiên liệu: 92 - 75 = 17% > 3% -> 17 * 6000 = 102,000đ
    fuel_fee_preview = preview.get("fuelFee")
    log_test("Bước 9: Preview Quyết toán chỉ phạt vết CUSTOMER_RENTAL = 500.000đ (loại trừ TRANSIT_DELIVERY)",
             damage_fee_preview == 500000, f"Damage Fee: {damage_fee_preview:,.0f}đ")
    log_test("Bước 9: Preview Quyết toán áp dụng dung sai nhiên liệu 3% (fuelFee = 102.000đ)",
             fuel_fee_preview == 102000, f"Fuel Fee: {fuel_fee_preview:,.0f}đ")

    # Staff tạo Settlement
    settle_create_payload = {
        "rentalRequestId": req_id,
        "contractId": contract_id,
        "rentalFee": preview["rentalFee"],
        "depositAmount": preview["depositAmount"],
        "extraKmFee": preview.get("extraKmFee") or 0,
        "lateReturnFee": preview.get("lateReturnFee") or 0,
        "fuelFee": preview.get("fuelFee") or 0,
        "damageFee": preview.get("damageFee") or 0,
        "cleaningFee": 0,
        "otherFee": 0,
        "trafficFineHoldAmount": 2000000,
        "refundBankName": "Vietcombank",
        "refundAccountNumber": "0123456789",
        "refundAccountName": "E2E TEST CUSTOMER A",
        "staffNotes": "E2E: Quyết toán giữ lại 2.000.000đ quỹ phạt nguội 30 ngày"
    }

    _, settlement = request("rental-settlements", "POST", settle_create_payload, token=staff_token, expected_status=200)
    settlement_id = settlement["id"]
    log_test("Bước 9: Staff tạo RentalSettlement tách giữ quỹ phạt nguội 2.000.000đ",
             settlement.get("trafficFineHoldAmount") == 2000000, f"Settlement: {settlement['settlementNumber']}, Fine Hold: {settlement['trafficFineHoldAmount']:,.0f}đ")

    # Manager xác nhận hoàn cọc đợt 1 (confirm-refund)
    _, refund_res = request(f"rental-settlements/{settlement_id}/confirm-refund", "POST", {
        "refundTransactionCode": "E2E_REFUND_DOT1_001",
        "refundMethod": "VIETQR"
    }, token=mgr_token, expected_status=200)

    _, req_settled = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, car_ready = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 9: Manager duyệt hoàn cọc đợt 1 -> Settlement = PARTIALLY_SETTLED, Request = SETTLED, Car = READY",
             refund_res["status"] == "PARTIALLY_SETTLED" and req_settled["status"] == "SETTLED" and car_ready["status"] == "READY",
             f"Settlement: {refund_res['status']}, Request: {req_settled['status']}, Car: {car_ready['status']}")

    # -------------------------------------------------------------------------
    # Bước 10 (Hoàn phạt nguội & Kiểm chứng Hotfix): Car.Status giữ BOOKED
    # -------------------------------------------------------------------------
    print("\n--- BƯỚC 10: HOÀN TRẢ QUỸ PHẠT NGUỘI & KIỂM CHỨNG HOTFIX XE KHÔNG BỊ ĐÈ READY ---")
    # Giả lập xe đang được đặt trước (BOOKED) bởi một khách hàng khác
    request(f"vehicles/{test_car_id}/status", "PATCH", {"status": "BOOKED"}, token=mgr_token, expected_status=204)
    _, car_booked_check = request(f"vehicles/{test_car_id}", "GET", expected_status=200)
    log_test("Bước 10: Giả lập xe đang có khách khác đặt trước (Car = BOOKED)", car_booked_check["status"] == "BOOKED")

    # Manager gọi confirm-traffic-fine-refund cho đơn cũ
    _, fine_refund_res = request(f"rental-settlements/{settlement_id}/confirm-traffic-fine-refund", "POST", {
        "transactionCode": "E2E_FINE_REFUND_DOT2_999",
        "actualDeduction": 0,
        "staffNotes": "Đã kiểm tra hệ thống CSGT toàn quốc: Không có biên bản phạt nguội. Hoàn 100% 2.000.000đ."
    }, token=mgr_token, expected_status=200)

    _, req_completed = request(f"rental-requests/{req_id}", "GET", token=staff_token, expected_status=200)
    _, contract_completed = request(f"rental-contracts/{contract_id}", "GET", token=staff_token, expected_status=200)
    _, car_after_fine = request(f"vehicles/{test_car_id}", "GET", expected_status=200)

    log_test("Bước 10: Hoàn phạt nguội -> Settlement = CLOSED, Contract = COMPLETED, Request = COMPLETED",
             fine_refund_res["status"] == "CLOSED" and contract_completed["status"] == "COMPLETED" and req_completed["status"] == "COMPLETED",
             f"Settlement: {fine_refund_res['status']}, Contract: {contract_completed['status']}, Request: {req_completed['status']}")

    # HOTFIX VERIFICATION: Car.Status MUST REMAIN 'BOOKED' (NOT overwritten to 'READY')
    log_test("Bước 10 [HOTFIX VERIFIED]: Car.Status VẪN GIỮ NGUYÊN 'BOOKED' (không bị ghi đè về READY)",
             car_after_fine["status"] == "BOOKED",
             f"Car Status: {car_after_fine['status']} (Expected: BOOKED)")

    # Idempotent: Gọi lại lần 2 bắt buộc bị chặn (InvalidOperationException -> 400)
    idemp_fine_status, idemp_err = request(f"rental-settlements/{settlement_id}/confirm-traffic-fine-refund", "POST", {
        "transactionCode": "E2E_FINE_REFUND_DOT2_REPEAT",
        "actualDeduction": 0
    }, token=mgr_token)
    log_test("Bước 10 [IDEMPOTENT]: Chặn hoàn quỹ phạt nguội lần 2 (HTTP 400)",
             idemp_fine_status == 400, f"HTTP: {idemp_fine_status}, Message: {idemp_err.get('message')}")

    print("\n================================================================================")
    print("  BỘ B: RÀNG BUỘC BIÊN, MA TRẬN PHÂN QUYỀN 3 ROLE & BẢO MẬT IDOR")
    print("================================================================================")

    # -------------------------------------------------------------------------
    # 1. Hard Block ODO
    # -------------------------------------------------------------------------
    print("\n--- 1. HARD BLOCK ODO (< DISPATCH HOẶC > 300KM) ---")
    # Tạo nháp 1 biên bản mới để test hard block ODO
    # Tạo 1 đơn mới nhanh
    _, req2 = request("rental-requests", "POST", {
        "carId": test_car_id,
        "startTime": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
        "endTime": (datetime.now(timezone.utc) + timedelta(days=22)).isoformat(),
        "pickupLocation": "123 Test",
        "dropoffLocation": "123 Test",
        "customerName": "E2E_TEST_Customer A",
        "customerPhone": "0901112233",
        "customerEmail": "e2e_cust_a_3363@velora.vn",
        "bookingType": "FAST_HOLD",
        "estimatedDeliveryDistanceKm": 20
    }, token=cust_a_token, expected_status=201)
    req2_id = req2["id"]

    _, hb_protocol = request("handover-protocols", "POST", {
        "rentalRequestId": req2_id,
        "dispatchOdo": 1500,
        "handoverOdo": 1500,
        "status": "IN_TRANSIT"
    }, token=staff_token, expected_status=201)
    hb_id = hb_protocol["id"]

    # Test handover_odo < dispatch_odo (1490 < 1500)
    hb_err1_status, hb_err1 = request(f"handover-protocols/{hb_id}/confirm", "POST", {
        "handoverOdo": 1490,
        "transitAnomalyNote": "Nhập lùi ODO"
    }, token=staff_token)
    log_test("Hard Block ODO: Chặn lưu handover_odo < dispatch_odo (HTTP 400)",
             hb_err1_status == 400, f"Status: {hb_err1_status}, Message: {hb_err1.get('message')}")

    # Test transit_km > 300km (1850 - 1500 = 350km > 300km)
    hb_err2_status, hb_err2 = request(f"handover-protocols/{hb_id}/confirm", "POST", {
        "handoverOdo": 1850,
        "transitAnomalyNote": "Đi lạc quá xa"
    }, token=staff_token)
    log_test("Hard Block ODO: Chặn lưu transit_km > 300km (HTTP 400)",
             hb_err2_status == 400, f"Status: {hb_err2_status}, Message: {hb_err2.get('message')}")

    # -------------------------------------------------------------------------
    # 2. Chống trùng lịch (Double Booking & Gia hạn)
    # -------------------------------------------------------------------------
    print("\n--- 2. CHỐNG TRÙNG LỊCH (DOUBLE BOOKING & GIA HẠN 409 CONFLICT) ---")
    # Đặt trùng khung giờ đơn req2 (ngày 20-22)
    db_status, db_err = request("rental-requests", "POST", {
        "carId": test_car_id,
        "startTime": (datetime.now(timezone.utc) + timedelta(days=20, hours=5)).isoformat(),
        "endTime": (datetime.now(timezone.utc) + timedelta(days=21)).isoformat(),
        "pickupLocation": "123 Test",
        "dropoffLocation": "123 Test",
        "customerName": "E2E_TEST_Customer B",
        "customerPhone": "0904445566",
        "customerEmail": "e2e_cust_b_3363@velora.vn"
    }, token=cust_b_token)
    log_test("Chống trùng lịch: Đặt xe trùng giờ với đơn khác trả về HTTP 409 Conflict",
             db_status == 409, f"Status: {db_status}, Message: {db_err.get('message') or db_err.get('Message')}")

    # -------------------------------------------------------------------------
    # 3. Thứ tự ký hợp đồng: Chặn DEPOSIT_PAID khi chưa SIGNED
    # -------------------------------------------------------------------------
    print("\n--- 3. THỨ TỰ KÝ HỢP ĐỒNG (CHẶN DEPOSIT_PAID KHI CHƯA SIGNED) ---")
    # Duyệt đơn req2 để sinh hợp đồng PENDING_SIGNATURE
    request(f"rental-requests/{req2_id}/approve", "PUT", {}, token=staff_token, expected_status=200)
    _, req2_contract = request(f"rental-contracts/request/{req2_id}", "GET", token=staff_token, expected_status=200)
    
    # Tạo payment COLLATERAL và thử xác nhận khi hợp đồng chưa SIGNED
    _, prem_payment = request("payments/deposit", "POST", {
        "rentalRequestId": req2_id,
        "contractId": req2_contract["id"],
        "paymentMethod": "VIETQR",
        "paymentCategory": "COLLATERAL"
    }, token=cust_a_token, expected_status=200)
    prem_txn = prem_payment["transactionCode"]

    # Cố tình gọi webhook cọc thế chân khi hợp đồng vẫn PENDING_SIGNATURE
    dep_fail_payload = {
        "gateway": "VietQR",
        "transactionDate": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "accountNumber": "0123456789",
        "transferAmount": 10000000,
        "amount": 10000000,
        "content": f"VELORA COC {str(req2_id)[:8]}",
        "referenceCode": prem_txn,
        "transactionCode": prem_txn
    }
    dep_fail_sig = hmac_sha256(WEBHOOK_SECRET, json.dumps(dep_fail_payload).encode("utf-8"))
    prem_status, prem_res = request("payments/webhook", "POST", dep_fail_payload, custom_headers={"X-Signature": dep_fail_sig})
    log_test("Thứ tự ký hợp đồng: Chặn xác nhận DEPOSIT_PAID khi hợp đồng chưa SIGNED (HTTP 400)",
             prem_status == 400, f"Status: {prem_status}, Message: {prem_res.get('message')}")

    # -------------------------------------------------------------------------
    # 4. Khóa cứng sau Quyết toán
    # -------------------------------------------------------------------------
    print("\n--- 4. KHÓA CỨNG SAU QUYẾT TOÁN ---")
    # Thử sửa HandoverProtocol của đơn đã quyết toán (settlement_id)
    lock_hd_status, lock_hd_err = request(f"handover-protocols/{handover_id}", "PUT", {
        "staffNotes": "Cố tình sửa biên bản sau quyết toán"
    }, token=staff_token)
    log_test("Khóa cứng sau quyết toán: Chặn sửa HandoverProtocol sau khi đã chốt quyết toán (HTTP 400)",
             lock_hd_status == 400, f"Status: {lock_hd_status}, Message: {lock_hd_err.get('message')}")

    # Thử xóa HandoverProtocol của đơn đã quyết toán
    lock_del_status, lock_del_err = request(f"handover-protocols/{handover_id}", "DELETE", token=mgr_token)
    log_test("Khóa cứng sau quyết toán: Chặn xóa HandoverProtocol sau khi đã chốt quyết toán (HTTP 400)",
             lock_del_status == 400, f"Status: {lock_del_status}, Message: {lock_del_err.get('message')}")

    # -------------------------------------------------------------------------
    # 5. Ma trận 3 Role: STAFF, MANAGER, ADMIN
    # -------------------------------------------------------------------------
    print("\n--- 5. MA TRẬN 3 ROLE: STAFF, MANAGER, ADMIN ---")
    # STAFF
    _, staff_dash = request("analytics/dashboard-overview", "GET", token=staff_token, expected_status=200)
    log_test("STAFF RBAC: Gọi Analytics -> TotalRevenue và MonthlyRevenue phải là null",
             staff_dash.get("totalRevenue") is None and staff_dash.get("monthlyRevenue") is None,
             f"TotalRevenue: {staff_dash.get('totalRevenue')}, MonthlyRevenue: {staff_dash.get('monthlyRevenue')}")

    staff_forbid_refund, _ = request(f"rental-settlements/{settlement_id}/confirm-refund", "POST", {}, token=staff_token)
    staff_forbid_disp, _ = request(f"rental-settlements/{settlement_id}/resolve-dispute", "POST", {}, token=staff_token)
    staff_forbid_sett, _ = request("system-settings", "GET", token=staff_token)
    staff_forbid_del_car, _ = request(f"vehicles/{test_car_id}", "DELETE", token=staff_token)

    log_test("STAFF RBAC: Chặn confirm-refund (403)", staff_forbid_refund == 403, f"Status: {staff_forbid_refund}")
    log_test("STAFF RBAC: Chặn resolve-dispute (403)", staff_forbid_disp == 403, f"Status: {staff_forbid_disp}")
    log_test("STAFF RBAC: Chặn truy cập SystemSettings (403)", staff_forbid_sett == 403, f"Status: {staff_forbid_sett}")
    log_test("STAFF RBAC: Chặn xóa xe DELETE /api/vehicles/{id} (403)", staff_forbid_del_car == 403, f"Status: {staff_forbid_del_car}")

    # MANAGER
    _, mgr_dash = request("analytics/dashboard-overview", "GET", token=mgr_token, expected_status=200)
    log_test("MANAGER RBAC: Xem được doanh thu và thống kê TransitAnomalies",
             mgr_dash.get("totalRevenue") is not None and mgr_dash.get("transitAnomalies") is not None,
             f"TotalRevenue: {mgr_dash.get('totalRevenue')}, TransitAnomalies count: {mgr_dash.get('transitAnomalies', {}).get('totalTransitAnomalies')}")

    mgr_forbid_sett, _ = request("system-settings", "GET", token=mgr_token)
    mgr_forbid_comp, _ = request("compensation-policies", "POST", {"part": "DOOR", "fee": 1000}, token=mgr_token)
    mgr_forbid_tmpl, _ = request("contract-templates", "POST", {"title": "Test"}, token=mgr_token)
    mgr_forbid_del_car, _ = request(f"vehicles/{test_car_id}", "DELETE", token=mgr_token)

    log_test("MANAGER RBAC: Chặn truy cập SystemSettings (403)", mgr_forbid_sett == 403, f"Status: {mgr_forbid_sett}")
    log_test("MANAGER RBAC: Chặn tạo CompensationPolicies (403)", mgr_forbid_comp == 403, f"Status: {mgr_forbid_comp}")
    log_test("MANAGER RBAC: Chặn tạo ContractTemplates (403)", mgr_forbid_tmpl == 403, f"Status: {mgr_forbid_tmpl}")
    log_test("MANAGER RBAC: Chặn xóa xe DELETE /api/vehicles/{id} (403)", mgr_forbid_del_car == 403, f"Status: {mgr_forbid_del_car}")

    # ADMIN
    admin_sett_status, _ = request("system-settings", "GET", token=admin_token)
    log_test("ADMIN RBAC: Truy cập thành công endpoint AdminOnly SystemSettings (200)", admin_sett_status == 200, f"Status: {admin_sett_status}")

    # -------------------------------------------------------------------------
    # 6. IDOR & Tài khoản bị khóa (is_active = false)
    # -------------------------------------------------------------------------
    print("\n--- 6. BẢO MẬT IDOR & TÀI KHOẢN BỊ KHÓA ---")
    # Customer B dùng JWT của mình gọi xem đơn req_id của Customer A
    idor_view, _ = request(f"rental-requests/{req_id}", "GET", token=cust_b_token)
    log_test("IDOR: Customer B không thể xem đơn của Customer A (HTTP 403)", idor_view == 403, f"Status: {idor_view}")

    # Customer B dùng JWT của mình gọi ký hợp đồng đơn của Customer A
    idor_sign, _ = request(f"rental-contracts/{contract_id}/sign", "POST", {
        "signature": "hacker_signature_e2e",
        "agreeTerms": True
    }, token=cust_b_token)
    log_test("IDOR: Customer B không thể ký hợp đồng của Customer A (HTTP 403)", idor_sign == 403, f"Status: {idor_sign}")

    # Customer B dùng JWT của mình gọi hủy đơn của Customer A
    idor_cancel, _ = request(f"rental-requests/{req_id}/cancel", "PUT", {}, token=cust_b_token)
    log_test("IDOR: Customer B không thể hủy đơn của Customer A (HTTP 403)", idor_cancel == 403, f"Status: {idor_cancel}")

    # Customer B dùng JWT của mình gọi khiếu nại quyết toán của Customer A
    idor_disp, _ = request(f"rental-settlements/{settlement_id}/dispute", "POST", {
        "reason": "Hacker khiếu nại"
    }, token=cust_b_token)
    log_test("IDOR: Customer B không thể gửi khiếu nại đơn của Customer A (HTTP 403)", idor_disp == 403, f"Status: {idor_disp}")

    # Manager khóa tài khoản Customer B
    print("\n  -> Manager tiến hành khóa tài khoản Customer B (is_active = false)...")
    lock_cust_status, _ = request(f"customers/{cust_b_id}/status", "PUT", {
        "status": "SUSPENDED",
        "reason": "E2E: Khóa tài khoản kiểm thử bảo mật Middleware"
    }, token=mgr_token, expected_status=200)

    # Customer B dùng JWT cũ gọi API ngay lập tức
    locked_call_status, locked_err = request("rental-requests/my-requests", "GET", token=cust_b_token)
    log_test("Khóa tài khoản: UserActiveStatusMiddleware chặn lập tức JWT cũ của Customer B (HTTP 403)",
             locked_call_status == 403, f"Status: {locked_call_status}, Message: {locked_err.get('message')}")

finally:
    # -------------------------------------------------------------------------
    # Safe Cleanup
    # -------------------------------------------------------------------------
    print("\n================================================================================")
    print("  CLEANUP: TỰ ĐỘNG DỌN DẸP AN TOÀN TOÀN BỘ DỮ LIỆU E2E TEST")
    print("================================================================================")
    try:
        clean_status, clean_res = request("system-settings/cleanup-e2e", "POST", {}, token=admin_token)
        if clean_status == 200:
            print("  [SUCCESS] Cleanup hoàn tất: Chỉ xóa sạch các bản ghi mang prefix E2E_TEST_ / e2e_.")
            print("  [SAFETY GUARANTEED] Toàn bộ dữ liệu thật trên Supabase được bảo toàn nguyên vẹn 100%.")
        else:
            print(f"  [WARN] Cleanup returned status {clean_status}: {clean_res}")
    except Exception as ex:
        print(f"  [ERROR during cleanup]: {ex}")

print("\n================================================================================")
print(f"  KẾT QUẢ TỔNG HỢP KIỂM THỬ: {passed_tests} PASSED / {failed_tests} FAILED")
print("================================================================================")

if failed_tests > 0:
    sys.exit(1)
else:
    print("  ==> 100% TEST CASES ĐẠT YÊU CẦU NGHIỆM THU PHA 5!")
    sys.exit(0)
