import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# إعداد الصفحة
st.set_page_config(page_title="منصة المعلمين - إدارة الطلبات", page_icon="📚", layout="centered")

# --- تنسيقات CSS ---
st.markdown("""
    <style>
    .stApp { background-color: #0b132b; color: #ffffff; }
    h1, h2, label { color: #e0fbfc !important; direction: rtl; text-align: right; }
    .stTextInput input, .stSelectbox div[data-baseweb="select"] {
        background-color: #1c2541 !important; color: #ffffff !important;
        border-radius: 10px !important; border: 2px solid #3a506b !important;
    }
    .stButton button { background-color: #4ea8de; color: #0b132b; border-radius: 10px; width: 100%; font-weight: bold; }
    section[data-testid="stSidebar"] { background-color: #1c2541 !important; }
    </style>
""", unsafe_allow_html=True)

# --- إعداد الربط بـ Google Sheets ---
# تأكد من وضع ملف credentials.json في نفس مجلد الكود
def get_google_sheet():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
    client = gspread.authorize(creds)
    return client.open("TeachersData").sheet1

# --- القائمة الجانبية (بوابة الإدارة) ---
st.sidebar.title("🔐 بوابة الإدارة")
admin_password = st.sidebar.text_input("كلمة مرور المدير", type="password")

if admin_password == "900800":
    st.sidebar.success("تم تسجيل الدخول!")
    st.sidebar.subheader("📋 طلبات المعلمين")
    try:
        sheet = get_google_sheet()
        data = sheet.get_all_records()
        for i, row in enumerate(data):
            st.sidebar.write(f"**{row['Name']}** - {row['Subject']}")
    except:
        st.sidebar.error("تأكد من إعداد ملف Google Sheet و credentials.json")
elif admin_password:
    st.sidebar.error("كلمة مرور خاطئة!")

# --- الصفحة الرئيسية ---
st.markdown("<h1 style='text-align: center;'>📝 انضم إلينا كمعلم متميز</h1>", unsafe_allow_html=True)

with st.form("teacher_registration_form"):
    full_name = st.text_input("الاسم الكامل")
    phone_number = st.text_input("رقم الهاتف")
    email = st.text_input("البريد الإلكتروني")
    degree = st.text_input("المؤهل الدراسي")
    subject = st.selectbox("المادة", ["رياضيات", "لغة عربية", "لغة إنجليزية", "برمجة"])
    
    submitted = st.form_submit_button("إرسال الطلب")

    if submitted:
        try:
            sheet = get_google_sheet()
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            sheet.append_row([full_name, phone_number, email, degree, subject, "Pending", timestamp])
            st.success("تم إرسال طلبك بنجاح!")
        except:
            st.error("حدث خطأ في الاتصال بقاعدة البيانات. تأكد من ملف الإعدادات.")
