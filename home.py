import streamlit as st
import pandas as pd
import os

# --- إعدادات الصفحة والتصميم العصرية ---
st.set_page_config(page_title="منصة نوفا التعليمية", page_icon="🎓", layout="wide")

# تصميم CSS مخصص لواجهة عصرية وحديثة
st.markdown("""
    <style>
    /* تغيير لون الخلفية العامة والخطوط */
    .main {
        background-color: #f8f9fa;
        direction: rtl;
        font-family: 'Cairo', sans-serif;
    }
    
    /* تنسيق العناوين */
    h1, h2, h3 {
        color: #1e293b;
        font-weight: 700;
    }
    
    /* تنسيق الحاويات أو الكروت */
    div.stForm {
        background-color: #ffffff;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
    }
    
    /* تنسيق أزرار الإرسال */
    .stButton>button {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        font-weight: bold;
        border-radius: 8px;
        padding: 10px 20px;
        border: none;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        transition: 0.3s;
        width: 100%;
    }
    
    .stButton>button:hover {
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        box-shadow: 0 6px 15px rgba(99, 102, 241, 0.4);
    }
    
    /* تنسيق حقول الإدخال */
    .stTextInput>div>div>input, .stSelectbox>div>div>select {
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        padding: 10px;
    }
    
    /* شريط القائمة الجانبية */
    section[data-testid="stSidebar"] {
        background-color: #0f172a;
        color: white;
    }
    section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] label {
        color: white !important;
    }
    </style>
""", unsafe_allow_html=True)

# --- عنوان المنصة مع لمسة جمالية ---
st.markdown("<h1 style='text-align: center; color: #4f46e5;'>🎓 منصة نوفا التعليمية</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: #64748b; font-size: 18px;'>بوابة انضمام أفضل الكفاءات التعليمية للمستقبل</p>", unsafe_allow_html=True)
st.write("---")

# --- لوحة تحكم المدير (مخفية في القائمة الجانبية بشكل أنيق) ---
st.sidebar.title("🔐 بوابة الإدارة")
password = st.sidebar.text_input("كلمة مرور المدير", type="password")

if password == "ddee4dab": 
    st.sidebar.success("تم تسجيل الدخول بنجاح")
    st.subheader("📋 لوحة تحكم إدارة الطلبات")
    
    if os.path.isfile("teachers.csv"):
        df = pd.read_csv("teachers.csv")
        st.dataframe(df, use_container_width=True)
    else:
        st.info("لا توجد طلبات مسجلة حتى الآن.")

else:
    if password:
        st.sidebar.error("كلمة المرور غير صحيحة")

# --- نموذج التسجيل العصري (للمدرسين) ---
col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    st.markdown("### 📝 انضم إلينا كمعلم متميز")
    st.markdown("املأ النموذج أدناه وسنقوم بمراجعة طلبك في أقرب وقت.")
    
    with st.form("teacher_registration"):
        name = st.text_input("الاسم الكامل")
        phone = st.text_input("رقم الهاتف")
        email = st.text_input("البريد الإلكتروني (الإيميل)")
        qualification = st.text_input("خريج كلية ايه؟ (المؤهل الدراسي)")
        subject = st.selectbox("المادة المراد تدريسها", ["رياضيات", "عربي", "إنجليزي", "علوم", "حاسب آلي"])
        
        submit = st.form_submit_button("إرسال الطلب الآن")

        if submit:
            if name.strip() and phone.strip() and email.strip():
                new_data = pd.DataFrame({
                    "الاسم": [name], 
                    "الهاتف": [phone], 
                    "الإيميل": [email],
                    "المؤهل": [qualification],
                    "المادة": [subject], 
                    "الحالة": ["قيد الانتظار"]
                })
                
                if os.path.isfile("teachers.csv"):
                    new_data.to_csv("teachers.csv", mode='a', header=False, index=False, encoding='utf-8-sig')
                else:
                    new_data.to_csv("teachers.csv", index=False, encoding='utf-8-sig')
                    
                st.success("✨ تم إرسال طلبك بنجاح!")
                st.info("💡 طلبك الآن قيد المراجعة من الإدارة، وسنتواصل معك قريباً.")
            else:
                st.error("⚠️ يرجى ملء الحقول الأساسية (الاسم، الهاتف، والإيميل).")
