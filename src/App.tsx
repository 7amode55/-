/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, 
  Users, 
  Layers, 
  ChevronRight, 
  Activity, 
  FileText, 
  UserCheck, 
  HelpCircle, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import TechDocs from './components/TechDocs';

export default function App() {
  // Portal state: 'home' | 'patient' | 'doctor' | 'docs'
  const [currentPortal, setCurrentPortal] = useState<'home' | 'patient' | 'doctor' | 'docs'>('home');

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-sans selection:bg-blue-500 selection:text-white" dir="rtl">
      
      {/* Universal Top Bar for Navigation Back to Choice */}
      {currentPortal !== 'home' && (
        <div className="bg-slate-900 text-white py-3 px-6 flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-500 fill-blue-500 animate-pulse" />
            <span className="text-xs font-black tracking-wide">المنصة الطبية الاستشارية المتكاملة (صحتي بلس)</span>
          </div>

          <button
            id="app-btn-back-to-home"
            onClick={() => setCurrentPortal('home')}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/5"
          >
            <span>الرجوع للرئيسية</span>
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Conditional Rendering of active portal */}
      <AnimatePresence mode="wait">
        {currentPortal === 'home' && (
          <motion.div
            key="home-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center justify-center min-h-[90vh]"
          >
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6 shadow-sm">
              <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-800">نظام المراقبة والتحليلات الصحية الشامل</span>
            </div>

            {/* Main Greeting / Title */}
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 text-center leading-tight tracking-tight mb-4">
              بوابتكم لخدمات <span className="text-blue-600">الرعاية والفرز الذكي</span> المتكاملة
            </h1>
            <p className="text-slate-500 text-xs md:text-sm text-center max-w-xl leading-relaxed mb-12">
              منصة سريرية متوافقة بالكامل مع بروتوكولات الأمان والمعايير الطبية لـ HIPAA و WHO. تتبع ذكي للمؤشرات الحيوية اليومية، وتوليد فوري للتحذيرات، ومراسلة مباشرة مع الكوادر الاستشارية.
            </p>

            {/* Portal Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              
              {/* Option: Patient Portal */}
              <button
                id="portal-select-patient"
                onClick={() => setCurrentPortal('patient')}
                className="bg-white hover:bg-slate-50/55 border border-slate-250 hover:border-blue-500 p-6 rounded-2xl text-right transition-all group flex flex-col justify-between h-56 text-slate-800 hover:shadow-md hover:-translate-y-1 duration-300"
              >
                <div>
                  <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950 mb-1">بوابة المريض (Patient Portal)</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    تتبع ضغط الدم، سكر الدم، الوزن، ومعدل خطواتك البدنية اليومية، مع توصيات ذكية فورية من Gemini.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  دخول كـ مريم العتيبي
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>

              {/* Option: Doctor Portal */}
              <button
                id="portal-select-doctor"
                onClick={() => setCurrentPortal('doctor')}
                className="bg-white hover:bg-slate-50/55 border border-slate-250 hover:border-teal-500 p-6 rounded-2xl text-right transition-all group flex flex-col justify-between h-56 text-slate-800 hover:shadow-md hover:-translate-y-1 duration-300"
              >
                <div>
                  <div className="bg-teal-50 text-teal-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950 mb-1">بوابة الطبيب والعيادة (Doctor EHR)</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    إدارة ملفات المرضى الطبية، فرز التنبيهات العاجلة، مراقبة التقارير السريرية، وإصدار الخطط الغذائية والجرعات.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  دخول كـ د. خالد السامرائي
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>

              {/* Option: Tech Docs */}
              <button
                id="portal-select-docs"
                onClick={() => setCurrentPortal('docs')}
                className="bg-white hover:bg-slate-50/55 border border-slate-250 hover:border-slate-450 p-6 rounded-2xl text-right transition-all group flex flex-col justify-between h-56 text-slate-800 hover:shadow-md hover:-translate-y-1 duration-300"
              >
                <div>
                  <div className="bg-slate-50 text-slate-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-slate-700 group-hover:text-white transition-all border border-slate-100">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-950 mb-1">الوثائق والخطط (Technical Docs)</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    تصفح تصميم قاعدة البيانات الشاملة، معمارية النظام، خطة الإطلاق والتسويق، ونظام ضمان الجودة السريري.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  عرض الوثائق (1-9)
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>

            </div>

            {/* Bottom Security Info Panel */}
            <div className="mt-16 flex items-center gap-2 text-[11px] text-slate-500 bg-white px-5 py-3 rounded-full border border-slate-200 shadow-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>تشفير سريري آمن ومؤمن بالكامل لحفظ السجلات الصحية وفقاً للمعايير الدولية (HIPAA/GDPR)</span>
            </div>

          </motion.div>
        )}

        {/* Portal: Patient */}
        {currentPortal === 'patient' && (
          <motion.div
            key="patient-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PatientPortal patientId="user_patient_1" />
          </motion.div>
        )}

        {/* Portal: Doctor */}
        {currentPortal === 'doctor' && (
          <motion.div
            key="doctor-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DoctorPortal />
          </motion.div>
        )}

        {/* Portal: Docs */}
        {currentPortal === 'docs' && (
          <motion.div
            key="docs-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TechDocs />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
