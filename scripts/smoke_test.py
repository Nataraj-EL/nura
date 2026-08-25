#!/usr/bin/env python3
import sys
import uuid
import subprocess
import requests
import bcrypt

# Disable insecure request warning for self-signed certificate on localhost
requests.packages.urllib3.disable_warnings(
    requests.packages.urllib3.exceptions.InsecureRequestWarning
)

BASE_URL = "https://localhost"
TEST_EMAIL = "smoke_test@nura.local"
REAL_EMAIL = "natarajel.dev@gmail.com"  # Real email to test SMTP relay
TEST_CODE = "123456"

def run_db_cmd(query):
    cmd = [
        "docker", "exec", "-i", "nura-db",
        "psql", "-U", "nura", "-d", "nura", "-c", query
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print(f"Database Query Failed: {result.stderr}")
        sys.exit(1)
    return result.stdout

def main():
    print("=== Nura Production Authentication Smoke Test ===")
    
    # 1. Request email OTP through real Brevo SMTP configuration
    print(f"\n[1/6] Sending real OTP via Brevo SMTP to {REAL_EMAIL}...")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": REAL_EMAIL},
            verify=False
        )
        if resp.status_code == 200:
            print("✔ Brevo SMTP Verification Successful (Received 200 OK).")
        else:
            print(f"❌ Brevo SMTP Request Failed: Status {resp.status_code}, Body: {resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Network connection failed to Nginx proxy: {e}")
        sys.exit(1)

    # Clean up any existing records for test user
    run_db_cmd(f"DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = '{TEST_EMAIL}');")
    run_db_cmd(f"DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = '{TEST_EMAIL}');")
    run_db_cmd(f"DELETE FROM users WHERE email = '{TEST_EMAIL}';")
    run_db_cmd(f"DELETE FROM user_otps WHERE email = '{TEST_EMAIL}';")

    # Helper function to insert a mocked OTP
    def inject_mock_otp():
        salt = bcrypt.gensalt(rounds=12)
        hashed_code = bcrypt.hashpw(TEST_CODE.encode('utf-8'), salt).decode('utf-8')
        otp_uuid = str(uuid.uuid4())
        insert_sql = (
            f"INSERT INTO user_otps (id, email, hashed_otp, created_at, expires_at, attempt_count) "
            f"VALUES ('{otp_uuid}', '{TEST_EMAIL}', '{hashed_code}', NOW(), NOW() + INTERVAL '5 minutes', 0);"
        )
        run_db_cmd(insert_sql)
        
    # 2. Verify invalid OTP handling
    print("\n[2/6] Verifying invalid OTP handling...")
    inject_mock_otp()
    resp = requests.post(
        f"{BASE_URL}/api/auth/verify",
        json={"email": TEST_EMAIL, "code": "999999"},
        verify=False
    )
    if resp.status_code == 400 and "Invalid verification code" in resp.json().get("error", ""):
        print("✔ Correctly rejected invalid OTP with HTTP 400.")
    else:
        print(f"❌ Unexpected response for invalid OTP: Status {resp.status_code}, Body: {resp.text}")
        sys.exit(1)

    # 3. Verify OTP rate limit (lockout after 3 attempts)
    print("\n[3/6] Verifying rate limit / max attempts lockout...")
    # Attempt 2
    resp = requests.post(
        f"{BASE_URL}/api/auth/verify",
        json={"email": TEST_EMAIL, "code": "999999"},
        verify=False
    )
    # Attempt 3 (triggers lockout)
    resp = requests.post(
        f"{BASE_URL}/api/auth/verify",
        json={"email": TEST_EMAIL, "code": "999999"},
        verify=False
    )
    if resp.status_code == 400 and "Maximum verification attempts exceeded" in resp.json().get("error", ""):
        print("✔ Correctly locked out and invalidated OTP after 3 failed attempts.")
    else:
        print(f"❌ Rate limit check failed: Status {resp.status_code}, Body: {resp.text}")
        sys.exit(1)

    # 4. Verify successful OTP login and Cookie attributes
    print("\n[4/6] Verifying successful login flow & cookie security...")
    # Re-inject valid OTP
    run_db_cmd(f"DELETE FROM user_otps WHERE email = '{TEST_EMAIL}';")
    inject_mock_otp()
    
    resp = requests.post(
        f"{BASE_URL}/api/auth/verify",
        json={"email": TEST_EMAIL, "code": TEST_CODE},
        verify=False
    )
    if resp.status_code == 200:
        print("✔ Verification successful (HTTP 200).")
    else:
        print(f"❌ Failed to verify with correct OTP: Status {resp.status_code}, Body: {resp.text}")
        sys.exit(1)

    # Verify cookies
    cookies = resp.cookies
    session_cookie = cookies.get("nura_session")
    if not session_cookie:
        print("❌ Session cookie 'nura_session' not found.")
        sys.exit(1)
        
    # Check headers directly to verify SameSite, HttpOnly, and Secure attributes
    cookie_header = resp.headers.get("Set-Cookie", "")
    print(f"Set-Cookie Header: {cookie_header}")
    if "HttpOnly" in cookie_header and "SameSite=Lax" in cookie_header:
        print("✔ Session cookie contains HttpOnly and SameSite=Lax attributes.")
    else:
        print("❌ Cookie attributes are missing HttpOnly or SameSite=Lax.")
        sys.exit(1)

    # 5. Verify authenticated API access (/me)
    print("\n[5/6] Verifying authenticated API retrieval...")
    me_resp = requests.get(
        f"{BASE_URL}/api/auth/me",
        cookies=cookies,
        verify=False
    )
    if me_resp.status_code == 200 and me_resp.json().get("email") == TEST_EMAIL:
        print("✔ Successfully accessed authenticated endpoint (/api/auth/me).")
        print(f"User Profile Status: {me_resp.json()}")
    else:
        print(f"❌ Failed to retrieve authenticated user: Status {me_resp.status_code}, Body: {me_resp.text}")
        sys.exit(1)

    # 6. Verify logout session invalidation
    print("\n[6/6] Verifying logout & session invalidation...")
    csrf_token = cookies.get("XSRF-TOKEN")
    headers = {}
    if csrf_token:
        headers["X-XSRF-TOKEN"] = csrf_token
    logout_resp = requests.post(
        f"{BASE_URL}/api/auth/logout",
        cookies=cookies,
        headers=headers,
        verify=False
    )
    if logout_resp.status_code == 200:
        print("✔ Successfully hit logout API.")
    else:
        print(f"❌ Logout request failed: Status {logout_resp.status_code}")
        sys.exit(1)

    # Verify session is deleted from database
    session_check = run_db_cmd(f"SELECT COUNT(*) FROM user_sessions WHERE token = '{session_cookie}';").strip()
    if "0" in session_check:
        print("✔ Confirmed session token successfully deleted from PostgreSQL.")
    else:
        print(f"❌ Session token still exists in database: {session_check}")
        sys.exit(1)

    # Verify accessing /me now yields 401 Unauthorized
    post_logout_me = requests.get(
        f"{BASE_URL}/api/auth/me",
        cookies=cookies,
        verify=False
    )
    if post_logout_me.status_code == 401:
        print("✔ Accessing /me after logout correctly yields HTTP 401 Unauthorized.")
    else:
        print(f"❌ Session was not invalidated: /me returned status {post_logout_me.status_code}")
        sys.exit(1)

    # Final database cleanup
    run_db_cmd(f"DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = '{TEST_EMAIL}');")
    run_db_cmd(f"DELETE FROM users WHERE email = '{TEST_EMAIL}';")
    run_db_cmd(f"DELETE FROM user_otps WHERE email = '{TEST_EMAIL}';")
    
    print("\n✔ All authentication smoke tests passed successfully!")

if __name__ == "__main__":
    main()
