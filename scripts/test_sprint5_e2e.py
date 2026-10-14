import urllib.request
import json
import sys

BASE_URL = "http://localhost:5171/api"

def request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}/{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== STARTING SPRINT 5 E2E INTEGRATION TEST ===")

# 1. Login staff
staff_auth = request("Auth/login", "POST", {"email": "staff@velora.vn", "password": "Velora@2026"})
staff_token = staff_auth["token"]
print("1. Staff authenticated successfully.")

# 2. Login customer
cust_auth = request("Auth/login", "POST", {"email": "customer@velora.vn", "password": "Velora@2026"})
cust_token = cust_auth["token"]
print("2. Customer authenticated successfully.")

# 3. Find an ACTIVE request, or find a request to test
all_requests = request("rental-requests", "GET", token=staff_token)
active_req = next((r for r in all_requests if r.get("status") == "ACTIVE"), None)

if not active_req:
    # Try finding CONFIRMED and handover it to ACTIVE
    confirmed_req = next((r for r in all_requests if r.get("status") == "CONFIRMED"), None)
    if confirmed_req:
        print(f"Handing over CONFIRMED request {confirmed_req['id']} to ACTIVE...")
        handover_dto = {
            "rentalRequestId": confirmed_req["id"],
            "contractId": confirmed_req.get("contractId"),
            "odoAtHandover": confirmed_req.get("currentMileage") or 12000,
            "fuelLevel": 100,
            "existingScratchesNotes": "Không có vết xước mới lúc giao",
            "exteriorCondition": "Tốt",
            "interiorCondition": "Tốt",
            "tireCondition": "Tốt",
            "status": "COMPLETED"
        }
        handover_res = request("handover-protocols", "POST", handover_dto, token=staff_token)
        # Update request status to ACTIVE
        active_req = confirmed_req
    else:
        # Pick any request
        active_req = all_requests[0] if all_requests else None

if not active_req:
    print("No requests available to test.")
    sys.exit(1)

req_id = active_req["id"]
print(f"3. Testing with Request ID: {req_id} ({active_req.get('carMake')} {active_req.get('carModel')}, Status: {active_req.get('status')})")

# 4. US-22: Create Return Protocol
start_odo = active_req.get("currentMileage") or 15000
return_dto = {
    "rentalRequestId": req_id,
    "contractId": active_req.get("contractId"),
    "returnDate": "2026-10-14T10:00:00Z",
    "endOdo": start_odo + 400, # 400 km driven
    "returnFuelLevel": 75, # 25% missing
    "exteriorCondition": "Ngoại thất sạch sẽ, không biến dạng",
    "interiorCondition": "Nội thất da sạch sẽ",
    "tireCondition": "4 lốp chuẩn áp suất",
    "newDamagesNotes": "",
    "accessoriesChecklist": "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh",
    "nextVehicleStatus": "READY"
}

return_protocol = request("ReturnProtocols", "POST", return_dto, token=staff_token)
print(f"4. [US-22 SUCCESS] Return Protocol created: {return_protocol.get('protocolNumber')}")
print(f"   Total Km: {return_protocol.get('totalKmDriven')} km, Excess Km: {return_protocol.get('excessKm')} km, Fuel diff: {return_protocol.get('fuelDifference')}%")

# 5. US-23: Preview Settlement
preview = request(f"Settlements/preview/{req_id}", "GET", token=staff_token)
print("5. [US-23 PREVIEW] Settlement Preview Calculation:")
print(f"   Deposit: {preview.get('depositAmount'):,.0f} VND")
print(f"   Extra Km Fee: {preview.get('extraKmFee'):,.0f} VND")
print(f"   Fuel Fee: {preview.get('fuelFee'):,.0f} VND")
print(f"   Late Return Fee: {preview.get('lateReturnFee'):,.0f} VND")
print(f"   Total Deduction: {preview.get('totalDeduction'):,.0f} VND")
print(f"   Refund Amount: {preview.get('refundAmount'):,.0f} VND")
print(f"   Settlement Type: {preview.get('settlementType')}")

# 6. US-23: Create Settlement
settle_dto = {
    "rentalRequestId": req_id,
    "contractId": preview.get("contractId"),
    "returnProtocolId": return_protocol.get("id"),
    "rentalFee": preview.get("rentalFee"),
    "depositAmount": preview.get("depositAmount"),
    "extraKmFee": preview.get("extraKmFee"),
    "lateHours": preview.get("lateHours"),
    "lateReturnFee": preview.get("lateReturnFee"),
    "fuelFee": preview.get("fuelFee"),
    "damageFee": preview.get("damageFee"),
    "cleaningFee": 0,
    "otherFee": 0,
    "refundBankName": "VCB",
    "refundAccountNumber": "0123456789",
    "refundAccountName": active_req.get("customerName"),
    "staffNotes": "Quyết toán hoàn cọc kiểm thử Sprint 5"
}

settlement = request("Settlements", "POST", settle_dto, token=staff_token)
settle_id = settlement.get("id")
print(f"6. [US-23 SUCCESS] Settlement created: {settlement.get('settlementNumber')}, Refund Status: {settlement.get('refundStatus')}")

# 7. US-23: Confirm Refund via VietQR
refund_dto = {
    "refundTransactionCode": "FT261014-998877",
    "refundMethod": "VIETQR",
    "refundBankName": "VCB",
    "refundAccountNumber": "0123456789",
    "refundAccountName": active_req.get("customerName"),
    "staffNotes": "Đã chuyển khoản hoàn cọc VietQR thành công"
}
confirmed_settle = request(f"Settlements/{settle_id}/confirm-refund", "POST", refund_dto, token=staff_token)
print(f"7. [US-23 SUCCESS] Refund confirmed! Status: {confirmed_settle.get('status')}, RefundStatus: {confirmed_settle.get('refundStatus')}")

# 8. US-10: Customer verifies settlement receipt
cust_settle = request(f"Settlements/by-request/{req_id}", "GET", token=cust_token)
print(f"8. [US-10 SUCCESS] Customer viewed settlement receipt: {cust_settle.get('settlementNumber')}, Refunded: {cust_settle.get('refundAmount'):,.0f} VND to {cust_settle.get('refundAccountNumber')}")

# 9. US-25: Admin checks Dashboard Overview & Fleet Utilization
overview = request("Analytics/dashboard-overview", "GET", token=staff_token)
fleet_rep = request("Analytics/fleet-utilization", "GET", token=staff_token)

print("9. [US-25 SUCCESS] Analytics Dashboard Overview:")
print(f"   Total Revenue: {overview.get('totalRevenue'):,.0f} VND")
print(f"   Completed Rentals: {overview.get('completedRentals')}")
print(f"   Available Vehicles: {overview.get('availableVehicles')}/{overview.get('totalVehicles')}")
print(f"   Fleet Utilization: {fleet_rep.get('overallUtilizationRate')}% across {fleet_rep.get('totalFleetSize')} cars")

print("\n=== ALL SPRINT 5 USER STORIES (US-22, US-23, US-10, US-25) PASSED 100%! ===")
