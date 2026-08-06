import streamlit as st
from datetime import datetime

# إعداد الصفحة
st.set_page_config(
    page_title="منصة المعلمين - إدارة الطلبات",
    page_icon="📚",
    layout="centered",
)

# --- تنسيقات CSS ---
st.markdown(
    """
    <style>
    .stApp { background-color: #0b132b; color: #ffffff; }
    h1, h2, label, .stMarkdown { color: #e0fbfc !important; direction: rtl; text-align: right; }
    .stTextInput input, .stSelectbox div[data-baseweb="select"] {
        background-color: #1c2541 !important; color: #ffffff !important;
        border-radius: 10px !important; border: 2px solid #3a506b !important;
    }
    .stButton button { background-color: #4ea8de; color: #0b132b; border-radius: 10px; width: 100%; font-weight: bold; }
    section[data-testid="stSidebar"] { background-color: #1c2541 !important; }
    </style>
""",
    unsafe_allow_html=True,
)

# تهيئة قاعدة البيانات المؤقتة في الذاكرة لتخزين الطلبات وعرضها للمدير فوراً
if "teachers_requests" not in st.session_state:
    st.session_state.teachers_requests = []

# --- القائمة الجانبية (بوابة الإدارة) ---
st.sidebar.title("🔐 بوابة الإدارة")
admin_password = st.sidebar.text_input(
    "كلمة مرور المدير", type="password", key="admin_pass"
)

# كلمة المرور المطلوبة
CORRECT_PASSWORD = "900800"

if admin_password == CORRECT_PASSWORD:
    st.sidebar.success("تم تسجيل الدخول بنجاح 🎉")
    st.sidebar.markdown("---")
    st.sidebar.subheader("📋 طلبات المعلمين المسجلين")

    if not st.session_state.teachers_requests:
        st.sidebar.info("لا توجد طلبات تسجیل حتى الآن.")
    else:
        for idx, req in enumerate(st.session_state.teachers_requests):
            with st.sidebar.expander(
                f"👤 {req['name']} ({req['subject']})"
            ):
                st.write(f"**الاسم الكامل:** {req['name']}")
                st.write(f"**رقم الهاتف:** {req['phone']}")
                st.write(f"**البريد الإلكتروني:** {req['email']}")
                st.write(f"**المؤهل / التخرج:** {req['degree']}")
                st.write(f"**المادة:** {req['subject']}")
                st.write(f"**وقت التسجيل:** {req['time']}")

                if st.button(f"حذف الطلب {idx+1}", key=f"del_{idx}"):
                    st.session_state.teachers_requests.pop(idx)
                    st.rerun()

elif admin_password:
    st.sidebar.error("كلمة المرور غير صحيحة!")

# --- الصفحة الرئيسية (نموذج تسجيل المعلمين) ---
st.markdown(
    "<h1 style='text-align: center;'>📝 انضم إلينا كمعلم متميز</h1>",
    unsafe_allow_html=True,
)
st.markdown(
    "<p style='text-align: center; color: #8ecae6;'>املأ النموذج أدناه وسنقوم بمراجعة طلبك والتواصل معك.</p>",
    unsafe_allow_html=True,
)

st.markdown("---")

with st.form("teacher_form"):
    full_name = st.text_input("الاسم الكامل")
    phone_number = st.text_input("رقم الهاتف")
    email = st.text_input("البريد الإلكتروني (الإيميل)")
    degree = st.text_input(
        "المؤهل الدراسي / التخرج (مثال: خريج كلية تربية قسم...)"
    )
    subject = st.selectbox(
        "المادة المراد تدريسها",
        [
            "رياضيات",
            "لغة عربية",
            "لغة إنجليزية",
            "علوم",
            "دراسات اجتماعية",
            "برمجة وتكنولوجيا",
            "أخرى",
        ],
    )

    submitted = st.form_submit_button("إرسال الطلب الآن")

    if submitted:
        if full_name and phone_number and email and degree:
            # حفظ كافة البيانات المطلوبة مع وقت التسجيل
            current_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")
            new_request = {
                "name": full_name,
                "phone": phone_number,
                "email": email,
                "degree": degree,
                "subject": subject,
                "time": current_time,
            }
            st.session_state.teachers_requests.append(new_request)
            st.success(
                "تم إرسال طلبك بنجاح! سيتم مراجعته والتواصل معك قريباً."
            )
        else:
            st.warning("الرجاء ملء جميع الحقول المطلوبة قبل الإرسال.")
