import os
import requests
import streamlit as st

# ============================================================
# CONFIGURATION
# ============================================================

API_URL = os.getenv(
    "API_URL",
    "http://localhost:8005"
).rstrip("/")

st.set_page_config(
    page_title="Smart City Infrastructure and Management System",
    page_icon="🏙️",
    layout="wide"
)

# ============================================================
# SESSION STATE
# ============================================================

if "token" not in st.session_state:
    st.session_state.token = None

if "user" not in st.session_state:
    st.session_state.user = None

if "page" not in st.session_state:
    st.session_state.page = "login"


# ============================================================
# API HELPERS
# ============================================================

def login_user(email, password):
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={
                "username": email,
                "password": password
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")

            if not token:
                return False, "Login succeeded but no token was returned."

            st.session_state.token = token

            # Get logged-in user details
            me_response = requests.get(
                f"{API_URL}/auth/me",
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=30
            )

            if me_response.status_code == 200:
                st.session_state.user = me_response.json()
                return True, "Login successful!"

            return False, "Login successful, but user details could not be loaded."

        try:
            error_data = response.json()
            detail = error_data.get("detail", "Login failed.")
        except Exception:
            detail = f"Login failed. Status code: {response.status_code}"

        return False, detail

    except Exception as e:
        return False, f"Could not connect to backend: {e}"


def register_user(name, email, password):
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json={
                "name": name,
                "email": email,
                "password": password,
                "role": "citizen"
            },
            timeout=30
        )

        if response.status_code in [200, 201]:
            return True, "Registration successful! You can now login."

        try:
            error_data = response.json()
            detail = error_data.get("detail", "Registration failed.")
        except Exception:
            detail = f"Registration failed. Status code: {response.status_code}"

        return False, detail

    except Exception as e:
        return False, f"Could not connect to backend: {e}"


def logout_user():
    st.session_state.token = None
    st.session_state.user = None
    st.session_state.page = "login"


# ============================================================
# LOGGED-IN DASHBOARD
# ============================================================

if st.session_state.token and st.session_state.user:

    user = st.session_state.user

    st.title("🏙️ Smart City Infrastructure and Management System")

    st.success("✅ Login successful!")

    st.divider()

    st.subheader("Welcome 👋")

    name = user.get("name", "Citizen")
    email = user.get("email", "")
    role = user.get("role", "citizen")

    st.write(f"### {name}")
    st.write(f"📧 **Email:** {email}")
    st.write(f"👤 **Role:** {role}")

    st.divider()

    st.subheader("Citizen Command Hub")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Reports", "0")

    with col2:
        st.metric("Pending", "0")

    with col3:
        st.metric("Resolved", "0")

    st.divider()

    if st.button("🚪 Logout"):
        logout_user()
        st.rerun()

# ============================================================
# LOGIN / SIGNUP
# ============================================================

else:

    st.title("🏙️ Smart City Infrastructure & Management System")

    st.write(
        "AI-Powered Municipal Defect Detection, Multi-Facility Triage & Dynamic Resource Dispatch"
    )

    st.divider()

    # --------------------------------------------------------
    # LOGIN
    # --------------------------------------------------------

    if st.session_state.page == "login":

        st.subheader("🔐 Login")

        email = st.text_input(
            "Email",
            placeholder="Enter your email"
        )

        password = st.text_input(
            "Password",
            type="password",
            placeholder="Enter your password"
        )

        if st.button("Login", use_container_width=True):

            if not email or not password:
                st.warning("Please enter email and password.")

            else:
                success, message = login_user(
                    email,
                    password
                )

                if success:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)

        st.divider()

        st.write("Don't have an account?")

        if st.button(
            "Create Citizen Account",
            use_container_width=True
        ):
            st.session_state.page = "signup"
            st.rerun()

    # --------------------------------------------------------
    # SIGNUP
    # --------------------------------------------------------

    elif st.session_state.page == "signup":

        st.subheader("📝 Citizen Registration")

        name = st.text_input(
            "Full Name",
            placeholder="Enter your name"
        )

        email = st.text_input(
            "Email",
            placeholder="Enter your email"
        )

        password = st.text_input(
            "Password",
            type="password",
            placeholder="Create a password"
        )

        confirm_password = st.text_input(
            "Confirm Password",
            type="password",
            placeholder="Confirm your password"
        )

        if st.button(
            "Create Account",
            use_container_width=True
        ):

            if not name or not email or not password:
                st.warning("Please fill all required fields.")

            elif password != confirm_password:
                st.error("Passwords do not match.")

            else:
                success, message = register_user(
                    name,
                    email,
                    password
                )

                if success:
                    st.success(message)

                    st.session_state.page = "login"

                    st.info(
                        "Please login using your new account."
                    )

                else:
                    st.error(message)

        st.divider()

        if st.button(
            "← Back to Login",
            use_container_width=True
        ):
            st.session_state.page = "login"
            st.rerun()