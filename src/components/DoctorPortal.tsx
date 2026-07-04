/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Heart, 
  Activity, 
  Scale, 
  Flame, 
  Settings, 
  Send, 
  Briefcase, 
  Check, 
  ChevronLeft, 
  User as UserIcon, 
  Shield, 
  DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, PatientProfile, HealthReading, Advice, Alert, ClinicStats, MedicalMessage } from '../types';

export default function DoctorPortal() {
  // Database State from Express API
  const [patients, setPatients] = useState<any[]>([]);
  const [clinicStats, setClinicStats] = useState<ClinicStats | null>(null);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  
  // UI and Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChronicFilter, setSelectedChronicFilter] = useState<string>('all');
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<string>('all');
  
  // Detail Panel State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'record' | 'readings' | 'advise' | 'chat'>('record');
  
  // Active Selected Patient Specific State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientReadings, setPatientReadings] = useState<HealthReading[]>([]);
  const [patientAlerts, setPatientAlerts] = useState<Alert[]>([]);
  const [patientAdvices, setPatientAdvices] = useState<Advice[]>([]);
  const [patientMessages, setPatientMessages] = useState<MedicalMessage[]>([]);

  // Forms State
  const [doctorAdviceTitle, setDoctorAdviceTitle] = useState<string>('');
  const [doctorAdviceContent, setDoctorAdviceContent] = useState<string>('');
  const [doctorAdviceCategory, setDoctorAdviceCategory] = useState<'nutrition' | 'medication' | 'exercise' | 'lifestyle' | 'general'>('medication');
  const [adviceSuccessMessage, setAdviceSuccessMessage] = useState<string>('');
  
  const [doctorChatInput, setDoctorChatInput] = useState<string>('');
  const [medicalHistoryEdit, setMedicalHistoryEdit] = useState<string>('');
  const [historyEditSuccess, setHistoryEditSuccess] = useState<boolean>(false);

  // Active Main Tabs ('dashboard' | 'patients' | 'alerts' | 'clinic')
  const [activeDoctorTab, setActiveDoctorTab] = useState<'dashboard' | 'patients' | 'alerts' | 'clinic'>('dashboard');

  // Fetch Clinic State & Patients list
  const fetchClinicData = async () => {
    try {
      const [resPatients, resStats, resAlerts] = await Promise.all([
        fetch('/api/patients').then(res => res.json()),
        fetch('/api/clinic/stats').then(res => res.json()),
        fetch('/api/alerts').then(res => res.json()),
      ]);

      setPatients(resPatients);
      setClinicStats(resStats);
      setAllAlerts(resAlerts);
    } catch (err) {
      console.error('Error fetching clinic data:', err);
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, []);

  // Fetch single patient files upon selection
  const handleSelectPatient = async (pId: string) => {
    setSelectedPatientId(pId);
    setActiveSubTab('record');
    setAdviceSuccessMessage('');
    setHistoryEditSuccess(false);

    try {
      const [resPatient, resReadings, resAlerts, resAdvices, resMsg] = await Promise.all([
        fetch(`/api/patients/${pId}`).then(res => res.json()),
        fetch(`/api/patients/${pId}/readings`).then(res => res.json()),
        fetch(`/api/patients/${pId}/alerts`).then(res => res.json()),
        fetch(`/api/patients/${pId}/advice`).then(res => res.json()),
        fetch(`/api/messages/user_doctor_1/${pId}`).then(res => res.json()),
      ]);

      setSelectedPatient(resPatient);
      setPatientReadings(resReadings);
      setPatientAlerts(resAlerts);
      setPatientAdvices(resAdvices);
      setPatientMessages(resMsg);
      setMedicalHistoryEdit(resPatient?.profile?.medicalHistory || '');
    } catch (err) {
      console.error('Error fetching patient detail data:', err);
    }
  };

  // Submit Advice
  const handleSendAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !doctorAdviceContent.trim()) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: doctorAdviceTitle || 'توجيهات علاجية جديدة',
          content: doctorAdviceContent,
          category: doctorAdviceCategory,
          doctorId: 'user_doctor_1',
          doctorName: 'د. خالد السامرائي',
          isAISuggestion: false
        })
      });
      const data = await res.json();
      if (data.success) {
        setPatientAdvices(prev => [data.advice, ...prev]);
        setDoctorAdviceTitle('');
        setDoctorAdviceContent('');
        setAdviceSuccessMessage('تم إصدار النصيحة الطبية وحفظها في ملف المريض بنجاح!');
        fetchClinicData();
      }
    } catch (err) {
      console.error('Error sending doctor advice:', err);
    }
  };

  // Submit doctor message to patient
  const handleSendDoctorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !doctorChatInput.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user_doctor_1',
          receiverId: selectedPatientId,
          content: doctorChatInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setPatientMessages(prev => [...prev, data.message]);
        setDoctorChatInput('');
      }
    } catch (err) {
      console.error('Error sending doctor message:', err);
    }
  };

  // Update Medical History of patient
  const handleUpdateMedicalHistory = async () => {
    if (!selectedPatientId) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicalHistory: medicalHistoryEdit })
      });
      const data = await res.json();
      if (data.success) {
        setHistoryEditSuccess(true);
        setSelectedPatient(prev => ({ ...prev, profile: { ...prev.profile, medicalHistory: medicalHistoryEdit } }));
      }
    } catch (err) {
      console.error('Error updating medical history:', err);
    }
  };

  // Acknowledge clinical alert from doctor side
  const handleAcknowledgeClinicAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' });
      if (res.ok) {
        setAllAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
        if (selectedPatientId) {
          setPatientAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
        }
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Filtering patients list
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const chronics = p.profile?.chronicConditions || [];
    const matchesChronic = selectedChronicFilter === 'all' || chronics.includes(selectedChronicFilter);
    
    // Check if patient has any unacknowledged alerts
    const patientAlertsList = allAlerts.filter(a => a.patientId === p.id && !a.isAcknowledged);
    const matchesAlert = selectedAlertFilter === 'all' || 
                         (selectedAlertFilter === 'with_alerts' && patientAlertsList.length > 0) ||
                         (selectedAlertFilter === 'no_alerts' && patientAlertsList.length === 0);

    return matchesSearch && matchesChronic && matchesAlert;
  });

  return (
    <div className="bg-[#F1F5F9] min-h-screen text-slate-800 font-sans flex flex-col md:flex-row text-right" dir="rtl">
      
      {/* Doctor Sidebar / Navigation (Sleek Theme) */}
      <div className="w-full md:w-64 bg-white flex flex-col shrink-0 border-l border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">صحتي بلس</h2>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">Clinics EHR Portal</span>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex-1 p-4 space-y-1 text-xs font-bold">
          {[
            { id: 'dashboard', label: 'لوحة التحكم السريرية', icon: TrendingUp },
            { id: 'patients', label: 'إدارة السجلات والملفات', icon: Users },
            { id: 'alerts', label: 'إدارة التنبيهات والفرز', icon: AlertTriangle, badge: allAlerts.filter(a => !a.isAcknowledged).length },
            { id: 'clinic', label: 'إدارة العيادة والموظفين', icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDoctorTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`doctor-nav-${tab.id}`}
                onClick={() => {
                  setActiveDoctorTab(tab.id as any);
                  setSelectedPatientId(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-blue-750 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-650' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Doctor Identity */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <img 
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150" 
            alt="د. خالد" 
            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-xs font-bold text-slate-900">د. خالد السامرائي</h4>
            <span className="text-[9px] text-slate-500 block mt-0.5">استشاري باطنية وغدد صماء</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* ==========================================
            TAB: DOCTOR CLINICAL DASHBOARD
            ========================================== */}
        {activeDoctorTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Page Title */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">لوحة المراقبة والتحليلات الطبية اليومية</h2>
              <p className="text-xs text-slate-400">إحصائيات فورية وتنبيهات طارئة لمرضى العيادة</p>
            </div>

            {/* Quick Metrics (Prompt 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">المرضى المسجلين</span>
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{clinicStats?.totalPatients || 2} مريضاً</h3>
                <span className="text-[10px] text-emerald-600 block mt-1">تزامن تلقائي مستمر</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">التنبيهات العاجلة النشطة</span>
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-rose-600">{allAlerts.filter(a => !a.isAcknowledged).length} تنبيهاً</h3>
                <span className="text-[10px] text-slate-400 block mt-1">تتطلب التواصل السريع مع المريض</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">العوائد والإيرادات (شهري)</span>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-emerald-700">2,850 ريال</h3>
                <span className="text-[10px] text-slate-400 block mt-1">من اشتراكات الفواتير والباقات</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">الأطباء والممرضين</span>
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">3 كوادر</h3>
                <span className="text-[10px] text-slate-400 block mt-1">تحت إدارة مجمع الاستشاريين</span>
              </div>

            </div>

            {/* Live Alerts Inbox & Clinical Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Emergency Alerts List */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  التنبيهات السريرية الطارئة المعلقة
                </h3>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {allAlerts.filter(a => !a.isAcknowledged).map(alert => (
                    <div key={alert.id} className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>المريض: {alert.patientName}</span>
                          <span className="text-[10px] text-rose-600">حرج خطير (خطر)</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed mt-1.5">{alert.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-2">وقت التوليد: {new Date(alert.timestamp).toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-rose-100/40 pt-2">
                        <button
                          id={`btn-dashboard-view-patient-${alert.patientId}`}
                          onClick={() => {
                            setActiveDoctorTab('patients');
                            handleSelectPatient(alert.patientId);
                          }}
                          className="text-blue-600 font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          شاهد الملف الشامل للمريض
                        </button>
                        <button
                          id={`btn-dashboard-ack-alert-${alert.id}`}
                          onClick={() => handleAcknowledgeClinicAlert(alert.id)}
                          className="bg-rose-600 text-white hover:bg-rose-700 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                        >
                          تأكيد الاستجابة
                        </button>
                      </div>
                    </div>
                  ))}
                  {allAlerts.filter(a => !a.isAcknowledged).length === 0 && (
                    <p className="text-sm text-slate-400 py-10 text-center">لا توجد أي تنبيهات طارئة معلقة لليوم. عيادتك آمنة ومستقرة!</p>
                  )}
                </div>
              </div>

              {/* Clinic Activity Logs (EHR Standards) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  سجل الأنشطة والتدقيق الطبي في العيادة
                </h3>

                <div className="space-y-4">
                  {clinicStats?.recentLogs?.map(log => (
                    <div key={log.id} className="flex items-center justify-between border-b border-slate-50 pb-3 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-slate-900 block">{log.action}</span>
                        <span className="text-[10px] text-slate-400">بواسطة: {log.user}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: PATIENTS LIST & FILE RECORD (EHR style)
            ========================================== */}
        {activeDoctorTab === 'patients' && (
          <div className="space-y-8">
            
            {!selectedPatientId ? (
              // Patients Search & Grid
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">سجلات المرضى والملفات السريرية</h3>
                    <p className="text-xs text-slate-400">ابحث وفلتر وتحكم بملفات المرضى المسجلين</p>
                  </div>
                </div>

                {/* Filter and search blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      id="input-patient-search"
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      placeholder="ابحث باسم المريض أو بريده..." 
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs pr-9 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>

                  {/* Chronic Filter */}
                  <div className="relative">
                    <select
                      id="select-chronic-filter"
                      value={selectedChronicFilter}
                      onChange={e => setSelectedChronicFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="all">كل الحالات المزمنة</option>
                      <option value="ارتفاع ضغط الدم">ارتفاع ضغط الدم</option>
                      <option value="السكري من النوع الثاني">السكري من النوع الثاني</option>
                    </select>
                  </div>

                  {/* Alert Filter */}
                  <div className="relative">
                    <select
                      id="select-alert-filter"
                      value={selectedAlertFilter}
                      onChange={e => setSelectedAlertFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="all">كل المرضى</option>
                      <option value="with_alerts">المرضى الذين لديهم تنبيهات نشطة</option>
                      <option value="no_alerts">المرضى بدون تنبيهات</option>
                    </select>
                  </div>

                </div>

                {/* Patient Grid / Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold">
                        <th className="p-4">اسم المريض</th>
                        <th className="p-4">العمر / الجنس</th>
                        <th className="p-4">الأمراض المزمنة</th>
                        <th className="p-4">تنبيهات طارئة معلقة</th>
                        <th className="p-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredPatients.map(patient => {
                        const unacknowledged = allAlerts.filter(a => a.patientId === patient.id && !a.isAcknowledged);
                        return (
                          <tr key={patient.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-4 flex items-center gap-3">
                              <img 
                                src={patient.avatar} 
                                alt={patient.name} 
                                className="w-10 h-10 rounded-xl object-cover border"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-slate-950 block">{patient.name}</span>
                                <span className="text-[10px] text-slate-400">{patient.email}</span>
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              {patient.profile?.age} سنة / {patient.profile?.gender === 'female' ? 'أنثى' : 'ذكر'}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {patient.profile?.chronicConditions?.map((c: string) => (
                                  <span key={c} className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-100">
                                    {c}
                                  </span>
                                ))}
                                {(!patient.profile?.chronicConditions || patient.profile.chronicConditions.length === 0) && (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {unacknowledged.length > 0 ? (
                                <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] animate-pulse">
                                  {unacknowledged.length} تنبيهات نشطة
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-bold text-xs">مستقر</span>
                              )}
                            </td>
                            <td className="p-4 text-xs">
                              <button
                                id={`btn-open-patient-file-${patient.id}`}
                                onClick={() => handleSelectPatient(patient.id)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px]"
                              >
                                فتح الملف السريري
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Detailed Patient Medical File (EHR style)
              <div className="space-y-6">
                
                {/* Back button */}
                <button
                  id="btn-back-to-patient-list"
                  onClick={() => setSelectedPatientId(null)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 border px-3 py-1.5 rounded-lg bg-white shadow-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                  الرجوع لقائمة السجلات
                </button>

                {/* Patient Overview Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedPatient?.avatar} 
                        alt={selectedPatient?.name} 
                        className="w-16 h-16 rounded-full object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedPatient?.name}</h2>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                          <span>العمر: <strong>{selectedPatient?.profile?.age} سنة</strong></span>
                          <span>الجنس: <strong>{selectedPatient?.profile?.gender === 'female' ? 'أنثى' : 'ذكر'}</strong></span>
                          <span>فصيلة الدم: <strong>{selectedPatient?.profile?.bloodType}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {['record', 'readings', 'advise', 'chat'].map(subTab => (
                        <button
                          key={subTab}
                          id={`sub-nav-${subTab}`}
                          onClick={() => setActiveSubTab(subTab as any)}
                          className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all border ${
                            activeSubTab === subTab 
                              ? 'bg-slate-900 text-white border-transparent shadow' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {subTab === 'record' && 'التاريخ والملف السريري'}
                          {subTab === 'readings' && 'المؤشرات والرسوم'}
                          {subTab === 'advise' && 'إصدار توجيهات'}
                          {subTab === 'chat' && 'المحادثة الطبية'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub Tab: Clinical history editing */}
                {activeSubTab === 'record' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Medical history editor box */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-2">تعديل وتدقيق السيرة المرضية المعتمدة (EHR History)</h3>
                        <p className="text-xs text-slate-400 mb-4">التحديثات تخضع للائحة الخصوصية وتعدل ملف المريض المتاح في السحاب مباشرة.</p>
                        <textarea
                          id="edit-medical-history"
                          value={medicalHistoryEdit}
                          onChange={e => setMedicalHistoryEdit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs leading-relaxed font-mono focus:bg-white focus:outline-none"
                          rows={8}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <button
                          id="btn-update-history"
                          onClick={handleUpdateMedicalHistory}
                          className="bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                        >
                          حفظ وتحديث السجل
                        </button>
                        
                        {historyEditSuccess && (
                          <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <Check className="h-4 w-4" />
                            تم حفظ التعديلات وتحديث ملف المريض بنجاح!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Patient Basic metrics */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs text-slate-600">
                      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">تفاصيل الطوارئ وجهات الاتصال</h3>
                      
                      <div>
                        <span className="text-slate-400 block mb-0.5">جهة اتصال الطوارئ:</span>
                        <strong className="text-slate-800 font-mono text-xs">{selectedPatient?.profile?.emergencyContact}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">الطول الحالي:</span>
                        <strong className="text-slate-800">{selectedPatient?.profile?.height} سم</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">الوزن الأخير:</span>
                        <strong className="text-slate-800">{selectedPatient?.profile?.weight} كغم</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">معرف المريض المجهول (Privacy):</span>
                        <strong className="text-slate-500 font-mono">{selectedPatient?.id}</strong>
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab: Readings & Charts */}
                {activeSubTab === 'readings' && (
                  <div className="space-y-6">
                    
                    {/* Mini table with readings */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">جدول القياسات الأخيرة المسجلة</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b text-slate-400 font-bold">
                              <th className="p-3">نوع المؤشر</th>
                              <th className="p-3">الوقت والتاريخ</th>
                              <th className="p-3">القيمة</th>
                              <th className="p-3">الملاحظات المدخلة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {patientReadings.map(r => (
                              <tr key={r.id}>
                                <td className="p-3 font-bold">
                                  {r.type === 'blood_pressure' && 'ضغط الدم'}
                                  {r.type === 'blood_sugar' && 'سكر الدم'}
                                  {r.type === 'weight' && 'الوزن'}
                                  {r.type === 'steps' && 'الخطوات'}
                                </td>
                                <td className="p-3 text-slate-400">{new Date(r.timestamp).toLocaleString('ar-SA')}</td>
                                <td className="p-3 font-mono font-bold text-slate-900">
                                  {r.type === 'blood_pressure' && `${r.systolic}/${r.diastolic} ملم زئبقي`}
                                  {r.type === 'blood_sugar' && `${r.sugarValue} ملغ/ديسيلتر (${r.sugarTestType === 'fasting' ? 'صيام' : 'عشوائي'})`}
                                  {r.type === 'weight' && `${r.weightValue} كغم`}
                                  {r.type === 'steps' && `${r.stepsCount?.toLocaleString()} خطوة`}
                                </td>
                                <td className="p-3 text-slate-400">{r.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab: Send Advice Form */}
                {activeSubTab === 'advise' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Advice formulation */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">صياغة توجيهات ووصفة سريرية جديدة (EHR Advice Formulation)</h3>
                      
                      <form onSubmit={handleSendAdvice} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">عنوان التوجيه السريري</label>
                          <input 
                            type="text" 
                            id="input-doctor-advice-title"
                            value={doctorAdviceTitle} 
                            onChange={e => setDoctorAdviceTitle(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold"
                            placeholder="مثال: خطة تخفيض الكربوهيدرات وتعديل دواء الضغط"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">تصنيف النصيحة</label>
                          <select
                            id="select-doctor-advice-category"
                            value={doctorAdviceCategory}
                            onChange={e => setDoctorAdviceCategory(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs"
                          >
                            <option value="medication">الأدوية والعلاجات الدوائية (Medication)</option>
                            <option value="nutrition">التغذية والأنظمة الغذائية (Nutrition)</option>
                            <option value="exercise">النشاط الرياضي والحركي (Exercise)</option>
                            <option value="lifestyle">نمط الحياة العام (Lifestyle)</option>
                            <option value="general">توجيهات عامة (General)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">شرح التوجيهات بالتفصيل للمريض</label>
                          <textarea
                            id="input-doctor-advice-content"
                            value={doctorAdviceContent}
                            onChange={e => setDoctorAdviceContent(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-xs leading-relaxed"
                            rows={5}
                            placeholder="اكتب التوجيهات والوصفة الطبية بوضوح ودقة لكي تظهر فوراً في لوحة تحكم المريض..."
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          id="btn-submit-doctor-advice"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all"
                        >
                          حفظ وإرسال التوجيه الطبي
                        </button>

                      </form>

                      {adviceSuccessMessage && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <Check className="h-4.5 w-4.5" />
                          {adviceSuccessMessage}
                        </div>
                      )}
                    </div>

                    {/* Advice Archive Box */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">سجل النصائح السابقة للمريض</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {patientAdvices.map(advice => (
                          <div key={advice.id} className="border border-slate-100 p-3 rounded-lg text-[11px] bg-slate-50">
                            <span className="font-bold text-slate-800 block mb-1">{advice.title}</span>
                            <p className="text-slate-600 leading-relaxed">{advice.content}</p>
                            <span className="text-[9px] text-slate-400 block mt-2 text-left">{new Date(advice.timestamp).toLocaleDateString('ar-SA')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab: Clinical chat */}
                {activeSubTab === 'chat' && (
                  <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[400px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                      {patientMessages.map(msg => {
                        const isDoctor = msg.senderId === 'user_doctor_1';
                        return (
                          <div key={msg.id} className={`flex ${isDoctor ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-md p-3 rounded-xl text-xs leading-relaxed shadow-xs ${
                              isDoctor 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-slate-800 border rounded-bl-none'
                            }`}>
                              <p>{msg.content}</p>
                              <span className={`text-[9px] block mt-1.5 text-right ${isDoctor ? 'text-blue-100' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form onSubmit={handleSendDoctorMessage} className="p-3 border-t bg-white flex gap-2">
                      <input 
                        type="text" 
                        id="input-doctor-chat"
                        value={doctorChatInput} 
                        onChange={e => setDoctorChatInput(e.target.value)} 
                        placeholder="اكتب ردك المباشر للمريض هنا..." 
                        className="flex-1 bg-slate-100 text-xs px-4 py-2 rounded-xl focus:bg-white focus:outline-none"
                      />
                      <button 
                        type="submit" 
                        id="btn-doctor-chat-send"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        <Send className="h-4 w-4 rotate-180" />
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ==========================================
            TAB: ALERTS AND TRIAGE
            ========================================== */}
        {activeDoctorTab === 'alerts' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">نظام فرز الحالات والتنبيهات السريرية (Triage Panel)</h3>
              <p className="text-xs text-slate-400">إدارة القياسات الشاذة والاستجابة الفورية وفقاً لـ WHO</p>
            </div>

            <div className="space-y-4">
              {allAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
                    alert.isAcknowledged 
                      ? 'bg-slate-50 border-slate-200 text-slate-500' 
                      : alert.severity === 'red_danger'
                        ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                        : 'bg-amber-50 border-amber-200 text-amber-950 font-bold'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${
                      alert.isAcknowledged 
                        ? 'text-slate-400' 
                        : alert.severity === 'red_danger' 
                          ? 'text-rose-600' 
                          : 'text-amber-500'
                    }`} />
                    <div>
                      <span>المريض: <strong>{alert.patientName}</strong></span>
                      <p className="mt-1 leading-relaxed">{alert.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1.5">وقت التنبيه: {new Date(alert.timestamp).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>

                  {!alert.isAcknowledged ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        id={`btn-triage-view-${alert.patientId}`}
                        onClick={() => {
                          setActiveDoctorTab('patients');
                          handleSelectPatient(alert.patientId);
                        }}
                        className="bg-white border text-slate-750 px-3 py-1.5 rounded-lg font-bold shadow-sm"
                      >
                        الملف الطبي
                      </button>
                      <button
                        id={`btn-triage-ack-${alert.id}`}
                        onClick={() => handleAcknowledgeClinicAlert(alert.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold"
                      >
                        تأكيد الفهم
                      </button>
                    </div>
                  ) : (
                    <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded">تم تأكيد الاستجابة</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CLINIC MANAGEMENT (EHR Specs)
            ========================================== */}
        {activeDoctorTab === 'clinic' && (
          <div className="space-y-8">
            
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 mb-4">هيكل الموظفين والعيادات الفرعية</h3>
              <p className="text-xs text-slate-400 mb-6">قائمة الكوادر المصرحة للوصول لسجلات المرضى الطبية</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 text-center">
                  <img 
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150" 
                    alt="د. خالد" 
                    className="w-12 h-12 rounded-full mx-auto object-cover border mb-3"
                    referrerPolicy="no-referrer"
                  />
                  <strong className="text-slate-900 block">د. خالد السامرائي</strong>
                  <span className="text-slate-400 text-[10px]">استشاري - المشرف العام</span>
                </div>

                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 text-center">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" 
                    alt="سارة الدوسري" 
                    className="w-12 h-12 rounded-full mx-auto object-cover border mb-3"
                    referrerPolicy="no-referrer"
                  />
                  <strong className="text-slate-900 block">سارة الدوسري</strong>
                  <span className="text-slate-400 text-[10px]">ممرضة فرز سريري</span>
                </div>

                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 text-center flex flex-col justify-center items-center">
                  <div className="bg-blue-50 text-blue-750 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                    +
                  </div>
                  <strong className="text-slate-900 block">إضافة ممرض/طبيب</strong>
                  <span className="text-slate-400 text-[10px]">إدارة صلاحيات الكوادر</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
