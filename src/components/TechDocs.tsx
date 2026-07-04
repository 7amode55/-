/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  CheckSquare, 
  Layers, 
  Code2, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function TechDocs() {
  const [activeSection, setActiveSection] = useState<'architecture' | 'erd' | 'api' | 'security' | 'launch' | 'qa'>('architecture');

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6 text-right">
          <div className="flex items-center gap-3 justify-start mb-2">
            <Layers className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">الوثائق التقنية ومعمارية النظام الصحية</h1>
          </div>
          <p className="text-slate-600">
            مستندات متكاملة تغطي التخطيط، تصميم قاعدة البيانات، التحليلات، الأمان، الـ APIs، وخطة الإطلاق وضمان الجودة (Prompts 1-9).
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/60 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: 'architecture', label: 'التخطيط والعمارة (1)', icon: Layers },
            { id: 'erd', label: 'قاعدة البيانات & ERD (2)', icon: Database },
            { id: 'api', label: 'الـ Backend & APIs (7)', icon: Code2 },
            { id: 'security', label: 'الأمان والامتثال (6)', icon: ShieldAlert },
            { id: 'launch', label: 'خطة الإطلاق (8)', icon: TrendingUp },
            { id: 'qa', label: 'خطة الجودة والاختبار (9)', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                id={`tech-tab-${tab.id}`}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-indigo-700 shadow-sm font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <motion.div
          key={activeSection}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8"
        >
          
          {/* Section: Architecture */}
          {activeSection === 'architecture' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                العمارة العامة للنظام وتدفق البيانات (PROMPT 1)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-800 mb-3 text-indigo-900">1. أدوار وصلاحيات المستخدمين</h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li><strong>👤 المريض (Patient):</strong> إدخال القياسات الحيوية، الاطلاع على الرسوم البيانية، تصفح النصائح الذكية، والتواصل المباشر مع الطبيب عبر الرسائل.</li>
                    <li><strong>🩺 الطبيب (Doctor):</strong> إدارة ملفات المرضى، مراقبة التنبيهات الحرجة، تحليل المؤشرات الذكية، وإصدار التوصيات الطبية والوصفات العلاجية.</li>
                    <li><strong>👩‍⚕️ الممرضة (Nurse):</strong> فرز المرضى، تدقيق القياسات، تسجيل المؤشرات الأولية، وإرسال التنبيهات العاجلة للأطباء.</li>
                    <li><strong>⚙️ الإداري (Clinic Admin):</strong> تتبع إحصائيات العيادة الإجمالية، الموظفين، الفواتير، ونشاط الاشتراكات الشهرية.</li>
                  </ul>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-800 mb-3 text-indigo-900">2. تدفق البيانات الرئيسي</h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li><strong>القياس والحقن:</strong> الأجهزة المتصلة أو المريض يرسل قراءة جديدة عبر الـ API.</li>
                    <li><strong>المعالجة والفرز:</strong> يمر القياس فوراً بمحرك القواعد السريرية لفرزه (طبيعي / تحذيري / خطر حرج).</li>
                    <li><strong>الذكاء الاصطناعي والتنبيهات:</strong> توليد توصيات تلقائية عبر Gemini وتخزين التنبيهات في قاعدة البيانات مع إرسال إشعار فوري للطبيب والعيادة في الحالات الحرجة.</li>
                    <li><strong>التصدير والتفاعل:</strong> تجميع البيانات في تقارير دورية وتصديرها كملفات PDF قابلة للمشاركة.</li>
                  </ul>
                </div>
              </div>

              <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-5">
                <h3 className="font-bold text-slate-800 mb-3 text-indigo-900">3. المكونات التقنية المقترحة في الإنتاج</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-700 block mb-1">الواجهات</span>
                    React & Flutter
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-700 block mb-1">الخلفية</span>
                    Node.js & Express
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-700 block mb-1">قاعدة البيانات</span>
                    PostgreSQL / Firestore
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-700 block mb-1">محرك الذكاء الاصطناعي</span>
                    Gemini 3.5 Flash SDK
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: ERD */}
          {activeSection === 'erd' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                تصميم قاعدة البيانات الشاملة (PROMPT 2)
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                هذا النموذج النصي المطور لـ ERD يغطي كافة الجداول المطلوبة مع العلاقات والمفاتيح الخارجية والنوع البياني الأمثل لكل حقل متوافقاً مع معايير الأداء والـ GDPR.
              </p>

              {/* ERD Graphic representation */}
              <div className="bg-slate-900 text-slate-300 font-mono text-xs rounded-xl p-5 overflow-x-auto mb-6 leading-relaxed text-left" dir="ltr">
                <pre>{`===================================================================
1. USERS TABLE (جدول المستخدمين)
===================================================================
- id (UUID, PK)
- name (VARCHAR, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- role (ENUM['patient', 'doctor', 'nurse', 'admin'])
- phone (VARCHAR)
- avatar_url (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

===================================================================
2. PATIENTS_PROFILES TABLE (ملفات المرضى)
===================================================================
- user_id (UUID, PK, FK -> Users.id, CASCADE)
- age (INT, NOT NULL)
- gender (ENUM['male', 'female'], NOT NULL)
- blood_type (VARCHAR)
- height (DECIMAL)
- weight (DECIMAL)
- emergency_contact (TEXT)
- medical_history (TEXT)
- chronic_conditions (JSONB) -- e.g., ["Diabetes", "Hypertension"]

===================================================================
3. READINGS TABLE (جدول القراءات الحيوية)
===================================================================
- id (UUID, PK)
- patient_id (UUID, FK -> Users.id)
- timestamp (TIMESTAMP, DEFAULT NOW)
- type (ENUM['blood_pressure', 'blood_sugar', 'weight', 'steps'])
- systolic (INT, NULLABLE) -- for blood_pressure
- diastolic (INT, NULLABLE) -- for blood_pressure
- sugar_value (DECIMAL, NULLABLE) -- for blood_sugar
- sugar_test_type (ENUM['fasting', 'random'], NULL)
- weight_value (DECIMAL, NULLABLE)
- steps_count (INT, NULLABLE)
- notes (TEXT)

===================================================================
4. ALERTS TABLE (جدول التنبيهات الطبية)
===================================================================
- id (UUID, PK)
- patient_id (UUID, FK -> Users.id)
- reading_id (UUID, FK -> Readings.id, NULLABLE)
- type (VARCHAR)
- severity (ENUM['red_danger', 'yellow_warning', 'normal'])
- message (TEXT, NOT NULL)
- is_acknowledged (BOOLEAN, DEFAULT FALSE)
- timestamp (TIMESTAMP)

===================================================================
5. ADVICE TABLE (جدول النصائح والتوجيهات الطبية)
===================================================================
- id (UUID, PK)
- patient_id (UUID, FK -> Users.id)
- doctor_id (UUID, FK -> Users.id)
- title (VARCHAR)
- content (TEXT)
- category (ENUM['nutrition', 'medication', 'exercise', 'lifestyle', 'general'])
- is_ai_suggestion (BOOLEAN)
- timestamp (TIMESTAMP)`}</pre>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
                <h4 className="font-bold text-slate-800 mb-2">العلاقات بين الجداول:</h4>
                <ul className="list-disc list-inside space-y-1.5 pr-4">
                  <li><strong>علاقة (1-to-1)</strong> بين جدول المستخدمين <code className="bg-slate-200/60 px-1 rounded text-indigo-700">Users</code> وجدول ملفات المرضى <code className="bg-slate-200/60 px-1 rounded text-indigo-700">Patients</code>.</li>
                  <li><strong>علاقة (1-to-Many)</strong> بين المريض والقياسات <code className="bg-slate-200/60 px-1 rounded text-indigo-700">Readings</code> (المريض الواحد له قراءات متعددة).</li>
                  <li><strong>علاقة (1-to-Many)</strong> بين المريض والتنبيهات <code className="bg-slate-200/60 px-1 rounded text-indigo-700">Alerts</code> لحصر الحالات الطارئة الخاصة به.</li>
                  <li><strong>علاقة (Many-to-Many)</strong> غير مباشرة بين الطبيب والمرضى عبر جدول النصائح والتوجيهات.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section: API */}
          {activeSection === 'api' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-indigo-600" />
                تصميم هيكلية الـ APIs والـ Backend (PROMPT 7)
              </h2>

              <p className="text-sm text-slate-600 mb-6">
                قائمة بأبرز طلبات الـ API لتطوير وتخديم تطبيق الصحة مع تفصيل لهيكل المدخلات والمخرجات.
              </p>

              <div className="space-y-6">
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">POST /api/patients/:id/readings</span>
                    <span className="text-xs text-slate-500">خاص بالمريض والأجهزة الذكية</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">يسجل قراءة حيوية جديدة ويقوم بفرزها وتوليد تنبيه تلقائي إن كانت خطرة.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] bg-slate-900 text-slate-300 rounded-lg p-3">
                    <div>
                      <span className="text-amber-400 block mb-1">// Request Body</span>
                      {JSON.stringify({
                        type: "blood_pressure",
                        systolic: 145,
                        diastolic: 95,
                        notes: "أشعر بالصداع منذ الصباح"
                      }, null, 2)}
                    </div>
                    <div>
                      <span className="text-sky-400 block mb-1">// Response (with triggered alert!)</span>
                      {JSON.stringify({
                        success: true,
                        reading: { id: "r_9283f", type: "blood_pressure", systolic: 145, diastolic: 95 },
                        alertTriggered: { severity: "red_danger", message: "تنبيه حرج: ارتفاع شديد في ضغط الدم (145/95)..." }
                      }, null, 2)}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">POST /api/gemini/generate-tips</span>
                    <span className="text-xs text-slate-500">خاص بمحرك الذكاء الاصطناعي</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">يتصل بـ Gemini 3.5 Flash لتحليل آخر 10 قراءات وتأليف خطة نصائح مخصصة باللغة العربية.</p>
                  <div className="font-mono text-[11px] bg-slate-900 text-slate-300 rounded-lg p-3">
                    <span className="text-sky-400 block mb-1">// Response</span>
                    {JSON.stringify({
                      success: true,
                      aiGenerated: true,
                      insights: "### 🩺 نصائح المساعد الذكي:\n1. **تنظيم ضغط الدم**: تذبذب القياسات الأخيرة..."
                    }, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Security */}
          {activeSection === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                استراتيجية الأمان والخصوصية (PROMPT 6)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-r-4 border-indigo-500 pr-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">1. التشفير وإخفاء الهوية (Encryption)</h3>
                    <p className="text-xs text-slate-600">
                      تشفير البيانات الحساسة أثناء النقل باستخدام (TLS 1.3) وتشفير البيانات أثناء السكون في خوادم السحاب باستخدام خوارزميات (AES-256). فصل بيانات الهوية الشخصية (PII) عن البيانات الطبية وربطها بمعرفات مجهولة (De-identification).
                    </p>
                  </div>
                  <div className="border-r-4 border-indigo-500 pr-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">2. التحكم بالوصول المبني على الأدوار (RBAC)</h3>
                    <p className="text-xs text-slate-600">
                      صلاحيات صارمة تمنع المرضى من رؤية ملفات الآخرين، وتسمح فقط للأطباء المصرح لهم والممرضات بالوصول لملفات المرضى المنتسبين لعياداتهم، مع حظر كامل للتعديل اليدوي على السجلات التاريخية لضمان سلامة السجل الطبي.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-r-4 border-indigo-500 pr-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">3. الامتثال للمواصفات العالمية والمحلية</h3>
                    <p className="text-xs text-slate-600">
                      التوافق مع قانون تداول التأمين الصحي والمساءلة الأمريكي <strong>HIPAA</strong> لإدارة السجلات الطبية الإلكترونية، ومعايير حماية البيانات العامة الأوروبية <strong>GDPR</strong> التي تعطي المريض الحق في سحب بياناته بالكامل وحذف حسابه تماشياً مع سياسة الخصوصية.
                    </p>
                  </div>
                  <div className="border-r-4 border-indigo-500 pr-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">4. الحماية من الاختراقات والمراقبة</h3>
                    <p className="text-xs text-slate-600">
                      استخدام الـ (ORM) لمنع ثغرات حقن SQL وسرقة الجلسات. تفعيل الـ (Rate Limiting) على الـ APIs لمنع هجمات الاستنزاف (DDoS)، والاحتفاظ بسجلات تدقيق كاملة للوصول والعمليات (Audit Logs) بشكل مستمر.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Launch */}
          {activeSection === 'launch' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                خطة الإطلاق والتسويق المتكاملة (PROMPT 8)
              </h2>

              <div className="space-y-6">
                {/* Timeline */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-3">🗓️ المراحل الزمنية لإطلاق منصة الصحة:</h3>
                  <div className="relative border-r-2 border-slate-200 pr-4 space-y-4 text-xs mr-2">
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 bg-indigo-600 rounded-full h-3.5 w-3.5 border-2 border-white" />
                      <p className="font-bold text-indigo-700">المرحلة الأولى (MVP) - الشهر الأول والثاني</p>
                      <p className="text-slate-600">إطلاق لوحة تحكم المريض وإدخال المؤشرات (الضغط والسكري)، وبوابة الطبيب لتلقي تنبيهات الطوارئ وتسهيل التواصل. استقطاب أول 5 عيادات تجريبية.</p>
                    </div>
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 bg-indigo-600 rounded-full h-3.5 w-3.5 border-2 border-white" />
                      <p className="font-bold text-indigo-700">المرحلة الثانية - الشهر الثالث والرابع</p>
                      <p className="text-slate-600">إدخال تكامل الأجهزة الذكية والأساور الرياضية بشكل كامل، تفعيل التوصيات الطبية الآلية القائمة على الذكاء الاصطناعي (Gemini)، وإجراء استبيانات الرضا والتحسين الفني.</p>
                    </div>
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 bg-indigo-600 rounded-full h-3.5 w-3.5 border-2 border-white" />
                      <p className="font-bold text-indigo-700">المرحلة الثالثة - الشهر الخامس والسادس</p>
                      <p className="text-slate-600">فتح بوابة التقارير الطبية التفصيلية القابلة للتحميل بنقرة واحدة، تفعيل نظم الفوترة وإدارة الموظفين للعيادات الإدارية الكبرى، والتوسع والترويج في الأسواق المجاورة.</p>
                    </div>
                  </div>
                </div>

                {/* Revenue model */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm mb-2">💰 نموذج تحقيق الإيرادات والنمو:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="font-bold text-slate-800 block mb-1">باقة المريض الاحترافية</span>
                      <strong>29.99 ريال / شهرياً</strong>
                      <p className="text-slate-500 mt-1">تتبع غير محدود للمؤشرات، توصيات ذكية، ربط 3 أجهزة ذكية، ومراسلة مجانية مع الطبيب.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="font-bold text-slate-800 block mb-1">الباقة العائلية الشاملة</span>
                      <strong>59.99 ريال / شهرياً</strong>
                      <p className="text-slate-500 mt-1">تشمل 4 أفراد للأسرة لمتابعة صحة الوالدين وكبار السن مع نظام تنبيه طوارئ مشترك.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="font-bold text-indigo-700 block mb-1">باقة العيادات والمراكز</span>
                      <strong>199.99 ريال / شهرياً</strong>
                      <p className="text-indigo-700 mt-1">لأصحاب العيادات لإدارة ملفات 500 مريض، إحصائيات متكاملة، فواتير وتقارير مخصصة.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: QA */}
          {activeSection === 'qa' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-indigo-600" />
                استراتيجية الجودة وسيناريوهات الاختبار (PROMPT 9)
              </h2>

              <p className="text-sm text-slate-600 mb-6">
                لضمان عمل تطبيق رعاية صحية حساس للبيانات، يجب وضع معايير جودة صارمة تغطي الجوانب الطبية والبرمجية والأمنية.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="font-bold text-indigo-600 block mb-2">1. اختبارات الوحدة والمنطق الطبي</span>
                  <p className="text-slate-600 mb-2"><strong>الهدف:</strong> اختبار خوارزمية فرز القياسات الحيوية بشكل دقيق وتجنب الأخطاء الكارثية.</p>
                  <p className="text-slate-500"><strong>مثال:</strong> التأكد من أن قياس ضغط الدم 145/95 يولد تلقائياً تنبيهاً بلون "أحمر حرج" بدون تأخير أو إعاقة برمجية.</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="font-bold text-indigo-600 block mb-2">2. اختبارات الاختراق والأمان</span>
                  <p className="text-slate-600 mb-2"><strong>الهدف:</strong> تلبية معايير OWASP Top 10 لحماية سرية المريض.</p>
                  <p className="text-slate-500"><strong>مثال:</strong> محاولة إجراء عمليات قرصنة أو حقن نصوص (XSS) في صفحة المحادثة مع الطبيب والتأكد من تصفية المدخلات والتعقيم الكامل.</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="font-bold text-indigo-600 block mb-2">3. اختبارات الأداء والتزامن</span>
                  <p className="text-slate-600 mb-2"><strong>الهدف:</strong> استمرارية العمل وصمود النظام عند الضغط الشديد.</p>
                  <p className="text-slate-500"><strong>مثال:</strong> محاكاة 5000 مريض يقومون برفع قراءاتهم الحيوية في نفس الدقيقة عبر الأجهزة الذكية، والتحقق من أن استجابة الـ API تظل أقل من 200ms.</p>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
