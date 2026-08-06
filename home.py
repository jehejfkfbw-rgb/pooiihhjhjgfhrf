import streamlit as st

# إعداد الصفحة
st.set_page_config(
    page_title="منصة المعلمين - إدارة الطلبات",
    page_icon="📚",
    layout="centered",
)

# --- تنسيقات CSS الجديدة بالكامل (ثيم ألوان عصري ومميز) ---
st.markdown(
    """
    <style>
    /* تغيير خلفية التطبيق بالكامل إلى لون داكن مميز ونظيف */
    .stApp {
        background-color: #0b132b;
        color: #ffffff;
    }
    
    /* العناوين والنصوص بتنسيق واضح */
    h1, h2, h3, h4, h5, h6, label, .stMarkdown {
        color: #e0fbfc !important;
        direction: rtl;
        text-align: right;
    }
    
    /* تنسيق حقول الإدخال والقوائم بلون متناسق وجميل */
    .stTextInput input, .stSelectbox div[data-baseweb="select"] {
        background-color: #1c2541 !important;
        color: #ffffff !important;
        border-radius: 10px !important;
        border: 2px solid #3a506b !important;
    }
    
    /* تنسيق الأزرار بلون بارز وجذاب */
    .stButton button {
        background-color: #4ea8de;
        color: #0b132b;
        border-radius: 10px;
        width: 100%;
        font-weight: bold;
        border: none;
        padding: 0.5rem;
    }
    .stButton button:hover {
        background-color: #48cae4;
        color: #0b132b;
    }

    /* تنسيق القائمة الجانبية (بوابة الإدارة) */
    section[data-testid="stSidebar"] {
        background-color: #1c2541 !important;
    }
    
    section[data-testid="stSidebar"] .stMarkdown, 
    section[data-testid="stSidebar"] label {
        color: #caf0f8 !important;
    }

    /* إصلاح عرض القائمة الجانبية على الهواتف المحمولة */
    @media (max-width: 768px) {
        section[data-testid="stSidebar"] {
            width: 80% !important;
        }
    }
    </style>
""",
    unsafe_allow_html=True,
)

# قاعدة بيانات مؤقتة لتخزين الطلبات
if "requests_list" not in st.session_state:
    st.session_state.requests_list = []

# --- القائمة الجانبية (بوابة الإدارة) ---
st.sidebar.title("🔐 بوابة الإدارة")
admin_password = st.sidebar.text_input(
    "كلمة مرور المدير", type="password", key="admin_pass"
)

# كلمة المرور الخاصة بك
CORRECT_PASSWORD = "admin123"

if admin_password == CORRECT_PASSWORD:
    st.sidebar.success("تم تسجيل الدخول بنجاح 🎉")
    st.sidebar.markdown("---")
    st.sidebar.subheader("📋 طلبات المعلمين الواردة")

    if not st.session_state.requests_list:
        st.sidebar.info("لا توجد طلبات جديدة حتى الآن.")
    else:
        for i, req in enumerate(st.session_state.requests_list):
            with st.sidebar.expander(
                f"طلب رقم {i+1}: {req['name']}"
            ):
                st.write(f"**الهاتف:** {req['phone']}")
                st.write(f"**الإيميل:** {req['email']}")
                st.write(f"**المؤهل:** {req['degree']}")
                st.write(f"**المادة:** {req['subject']}")

                if st.button(f"قبول وتواصل {i+1}", key=f"accept_{i}"):
                    st.success(
                        f"تم قبول المعلم {req['name']} بنجاح! للتواصل: {req['phone']}"
                    )
elif admin_password:
    st.sidebar.error("كلمة المرور غير صحيحة!")

# --- الصفحة الرئيسية (نموذج تسجيل المعلمين) ---
st.markdown(
    "<h1 style='text-align: center;'>📝 انضم إلينا كمعلم متميز</h1>",
    unsafe_allow_html=True,
)
st.markdown(
    "<p style='text-align: center; color: #8ecae6;'>املأ النموذج أدناه وسنقوم بمراجعة طلبك في أقرب وقت.</p>",
    unsafe_allow_html=True,
)

st.markdown("---")

# نموذج التسجيل
with st.form("teacher_registration_form"):
    full_name = st.text_input("الاسم الكامل")
    phone_number = st.text_input("رقم الهاتف")
    email = st.text_input("البريد الإلكتروني (الإيميل)")
    degree = st.text_input("خريج كلية إيه؟ (المؤهل الدراسي)")
    subject = st.selectbox(
        "المادة المراد تدريسها",
        [
            "رياضيات",
            "لغة عربية",
            "لغة إنجليزية",
            "علوم / دراسات",
            "برمجة وتكنولوجيا",
            "أخرى",
        ],
    )

    submitted = st.form_submit_button("إرسال الطلب الآن")

    if submitted:
        if full_name and phone_number and email and degree:
            new_request = {
                "name": full_name,
                "phone": phone_number,
                "email": email,
                "degree": degree,
                "subject": subject,
            }
            st.session_state.requests_list.append(new_request)
            st.success(
                "تم إرسال طلبك بنجاح! سيتم مراجعته والتواصل معك قريباً."
            )
        else:
            st.warning("الرجاء ملء جميع الحقول المطلوبة قبل إرسال الطلب.")
