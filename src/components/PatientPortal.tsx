/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  Scale, 
  Flame, 
  Plus, 
  History, 
  LineChart, 
  Sparkles, 
  MessageSquare, 
  Smartphone, 
  CreditCard, 
  FileDown, 
  AlertTriangle, 
  Check, 
  Send, 
  User as UserIcon, 
  Clock, 
  ChevronLeft, 
  TrendingUp, 
  RefreshCw, 
  Printer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HealthReading, Advice, Alert, ConnectedDevice, MedicalMessage, Subscription } from '../types';

interface PatientPortalProps {
  patientId: string;
}

export default function PatientPortal({ patientId }: PatientPortalProps) {
  // State from server/APIs
  const [patientData, setPatientData] = useState<any>(null);
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [messages, setMessages] = useState<MedicalMessage[]>([]);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new_reading' | 'history' | 'charts' | 'tips' | 'chat' | 'devices' | 'subscription' | 'report'>('dashboard');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isSyncingDevice, setIsSyncingDevice] = useState<string | null>(null);
  
  // New Reading form state
  const [newReadingType, setNewReadingType] = useState<'blood_pressure' | 'blood_sugar' | 'weight' | 'steps'>('blood_pressure');
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [sugarValue, setSugarValue] = useState<string>('100');
  const [sugarTestType, setSugarTestType] = useState<'fasting' | 'random'>('fasting');
  const [weightValue, setWeightValue] = useState<string>('75');
  const [stepsCount, setStepsCount] = useState<string>('6000');
  const [readingNotes, setReadingNotes] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');
  const [formAlertMessage, setFormAlertMessage] = useState<Alert | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [resPatient, resReadings, resAlerts, resAdvices, resDevices, resSub, resMsg] = await Promise.all([
        fetch(`/api/patients/${patientId}`).then(res => res.json()),
        fetch(`/api/patients/${patientId}/readings`).then(res => res.json()),
        fetch(`/api/patients/${patientId}/alerts`).then(res => res.json()),
        fetch(`/api/patients/${patientId}/advice`).then(res => res.json()),
        fetch(`/api/patients/${patientId}/devices`).then(res => res.json()),
        fetch(`/api/patients/${patientId}/subscription`).then(res => res.json()),
        fetch(`/api/messages/${patientId}/user_doctor_1`).then(res => res.json()),
      ]);

      setPatientData(resPatient);
      setReadings(resReadings);
      setAlerts(resAlerts);
      setAdvices(resAdvices);
      setDevices(resDevices);
      setSubscription(resSub);
      setMessages(resMsg);
    } catch (err) {
      console.error('Error fetching patient data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  // Scroll to chat bottom on message updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Submit new reading
  const handleSubmitReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMessage('');
    setFormAlertMessage(null);

    const payload: any = { type: newReadingType, notes: readingNotes };
    if (newReadingType === 'blood_pressure') {
      payload.systolic = Number(systolic);
      payload.diastolic = Number(diastolic);
    } else if (newReadingType === 'blood_sugar') {
      payload.sugarValue = Number(sugarValue);
      payload.sugarTestType = sugarTestType;
    } else if (newReadingType === 'weight') {
      payload.weightValue = Number(weightValue);
    } else if (newReadingType === 'steps') {
      payload.stepsCount = Number(stepsCount);
    }

    try {
      const res = await fetch(`/api/patients/${patientId}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setFormSuccessMessage('تم تسجيل القراءة الطبية بنجاح ومزامنتها في النظام!');
        setReadingNotes('');
        
        if (data.alertTriggered) {
          setFormAlertMessage(data.alertTriggered);
        }

        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error('Error submitting reading:', err);
    }
  };

  // Get AI health tips from Gemini
  const handleGenerateAITips = async () => {
    setIsLoadingAI(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/gemini/generate-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data.insights);
      }
    } catch (err) {
      console.error('Error generating AI advice:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Sync a connected smart device
  const handleSyncDevice = async (deviceId: string) => {
    setIsSyncingDevice(deviceId);
    try {
      const res = await fetch(`/api/patients/${patientId}/devices/${deviceId}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert(`تمت المزامنة بنجاح واستيراد قياسات جديدة من الجهاز!`);
      }
    } catch (err) {
      console.error('Error syncing device:', err);
    } finally {
      setIsSyncingDevice(null);
    }
  };

  // Send message to doctor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: patientId,
          receiverId: 'user_doctor_1',
          content: chatInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setChatInput('');
        
        // Simulate Doctor reply after a brief timeout to make the chat feel real and interactive!
        setTimeout(async () => {
          try {
            const replies = [
              "شكراً لإرسال قياساتك يا مريم. تظهر قراءاتك تحسناً ملحوظاً، التزمي بنشاطك الحالي.",
              "وعليكم السلام، القياسات ممتازة اليوم. واصلي على نفس الخطة الغذائية.",
              "أهلاً مريم. يرجى الاستمرار في تتبع مستويات السكر صباحاً ومساءً. أراقب التنبيهات باستمرار وسنتواصل إن دعت الحاجة لزيارة العيادة."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            const replyRes = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                senderId: 'user_doctor_1',
                receiverId: patientId,
                content: randomReply
              })
            });
            const replyData = await replyRes.json();
            if (replyData.success) {
              setMessages(prev => [...prev, replyData.message]);
            }
          } catch (replyErr) {
            console.error('Error simulating doctor response:', replyErr);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Upgrade Subscription Plan
  const handleUpgradePlan = async (plan: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        alert(`تهانينا! تم ترقية اشتراكك بنجاح إلى الباقة ${plan === 'pro' ? 'المتقدمة (Pro)' : 'الذهبية العائلية (Premium)'}`);
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err);
    }
  };

  // Extract latest readings for summary
  const getLatestReading = (type: string) => {
    return readings.find(r => r.type === type);
  };

  const latestBP = getLatestReading('blood_pressure');
  const latestSugar = getLatestReading('blood_sugar');
  const latestWeight = getLatestReading('weight');
  const latestSteps = getLatestReading('steps');

  // Classification logic (Prompt 3)
  const getBPStatus = (sys: number, dia: number) => {
    if (sys > 140 || dia > 90) return { label: 'مرتفع خطير', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (sys > 120 || dia > 80) return { label: 'مرتفع خفيف', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (sys < 90 || dia < 60) return { label: 'منخفض', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return { label: 'طبيعي', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  const getSugarStatus = (val: number, type: 'fasting' | 'random') => {
    if (type === 'fasting') {
      if (val >= 126) return { label: 'سكري', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      if (val >= 100) return { label: 'ما قبل السكري', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return { label: 'طبيعي', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    } else {
      if (val >= 200) return { label: 'ارتفاع حاد', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      return { label: 'طبيعي', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
  };

  const getBMIStatus = (weight: number, height: number) => {
    const bmi = weight / Math.pow(height / 100, 2);
    if (bmi >= 30) return { value: bmi.toFixed(1), label: 'سمنة مفرطة', color: 'text-rose-600 bg-rose-50' };
    if (bmi >= 25) return { value: bmi.toFixed(1), label: 'زيادة وزن', color: 'text-amber-600 bg-amber-50' };
    if (bmi < 18.5) return { value: bmi.toFixed(1), label: 'نحافة زائدة', color: 'text-blue-600 bg-blue-50' };
    return { value: bmi.toFixed(1), label: 'طبيعي مثالي', color: 'text-emerald-600 bg-emerald-50' };
  };

  const getStepsStatus = (steps: number) => {
    if (steps >= 10000) return { label: 'ممتاز نشط', color: 'text-emerald-600 bg-emerald-50' };
    if (steps >= 5000) return { label: 'متوسط مقبول', color: 'text-indigo-600 bg-indigo-50' };
    return { label: 'خمول قليل', color: 'text-amber-600 bg-amber-50' };
  };

  const activeAlerts = alerts.filter(a => !a.isAcknowledged);

  return (
    <div className="bg-[#F1F5F9] min-h-screen text-slate-800 font-sans pb-12" dir="rtl">
      
      {/* Patient Profile Header Card */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={patientData?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'} 
              alt={patientData?.name} 
              className="w-16 h-16 rounded-2xl border border-slate-200 object-cover shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{patientData?.name || 'مريم أحمد العتيبي'}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs mt-1.5 font-medium">
                <span>العمر: <strong className="text-slate-800">{patientData?.profile?.age || 45} سنة</strong></span>
                <span>فصيلة الدم: <strong className="text-slate-800">{patientData?.profile?.bloodType || 'A+'}</strong></span>
                <span>الحالة: <strong className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">مؤمن طبيّاً</strong></span>
                <span>الاشتراك: <strong className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{subscription?.plan || 'PRO'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              id="patient-btn-quick-entry"
              onClick={() => setActiveTab('new_reading')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              قراءة جديدة
            </button>
            <button 
              id="patient-btn-export-report"
              onClick={() => setActiveTab('report')}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              التقرير الطبي
            </button>
          </div>
        </div>
      </div>

      {/* Portal Main Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto flex gap-6 text-sm font-medium">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: Activity },
            { id: 'new_reading', label: 'تسجيل قياس', icon: Plus },
            { id: 'history', label: 'السجل الشامل', icon: History },
            { id: 'charts', label: 'المخططات البيانية', icon: LineChart },
            { id: 'tips', label: 'النصائح الذكية', icon: Sparkles },
            { id: 'chat', label: 'المراسلة', icon: MessageSquare },
            { id: 'devices', label: 'الأجهزة', icon: Smartphone },
            { id: 'subscription', label: 'الاشتراكات والترقيات', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`patient-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 flex items-center gap-2 transition-all shrink-0 font-semibold cursor-pointer ${
                  isActive 
                    ? 'border-blue-600 text-blue-750 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Urgent Alerts Notification Area */}
        {activeAlerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border text-sm ${
                  alert.severity === 'red_danger' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${alert.severity === 'red_danger' ? 'text-rose-600' : 'text-amber-500'}`} />
                  <div>
                    <span className="font-bold block">تنبيه صحي حاسم:</span>
                    <p className="mt-0.5">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">تاريخ التنبيه: {new Date(alert.timestamp).toLocaleString('ar-SA')}</span>
                  </div>
                </div>
                <button
                  id={`ack-alert-${alert.id}`}
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                    alert.severity === 'red_danger'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent'
                      : 'bg-amber-600 hover:bg-amber-700 text-white border-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  تأكيد وقراءة
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ==========================================
            TAB: DASHBOARD
            ========================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Quick Cards Grid (Prompt 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Blood Pressure Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm font-medium">ضغط الدم الأخير</span>
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                    <Heart className="h-5 w-5" />
                  </div>
                </div>
                {latestBP ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">{latestBP.systolic}/{latestBP.diastolic}</span>
                      <span className="text-xs text-slate-400">ملم زئبقي</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getBPStatus(latestBP.systolic || 120, latestBP.diastolic || 80).color}`}>
                        {getBPStatus(latestBP.systolic || 120, latestBP.diastolic || 80).label}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        منذ {new Date(latestBP.timestamp).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-3">لا توجد قراءات مسجلة.</p>
                )}
              </div>

              {/* Blood Sugar Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm font-medium">سكر الدم الأخير</span>
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                {latestSugar ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">{latestSugar.sugarValue}</span>
                      <span className="text-xs text-slate-400">ملغ/ديسل</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getSugarStatus(latestSugar.sugarValue || 100, latestSugar.sugarTestType || 'fasting').color}`}>
                        {latestSugar.sugarTestType === 'fasting' ? 'صيام' : 'عشوائي'} - {getSugarStatus(latestSugar.sugarValue || 100, latestSugar.sugarTestType || 'fasting').label}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        منذ {new Date(latestSugar.timestamp).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-3">لا توجد قراءات مسجلة.</p>
                )}
              </div>

              {/* Weight Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm font-medium">الوزن الأخير</span>
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                    <Scale className="h-5 w-5" />
                  </div>
                </div>
                {latestWeight && patientData?.profile ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">{latestWeight.weightValue}</span>
                      <span className="text-xs text-slate-400">كغم</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getBMIStatus(latestWeight.weightValue || 70, patientData.profile.height).color}`}>
                        BMI: {getBMIStatus(latestWeight.weightValue || 70, patientData.profile.height).value} ({getBMIStatus(latestWeight.weightValue || 70, patientData.profile.height).label})
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-3">لا توجد قراءات مسجلة.</p>
                )}
              </div>

              {/* Steps Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm font-medium">النشاط البدني اليوم</span>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <Flame className="h-5 w-5" />
                  </div>
                </div>
                {latestSteps ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">{latestSteps.stepsCount?.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">خطوة</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getStepsStatus(latestSteps.stepsCount || 0).color}`}>
                        {getStepsStatus(latestSteps.stepsCount || 0).label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-3">لا توجد قراءات مسجلة.</p>
                )}
              </div>

            </div>

            {/* Smart Tips Banner & Recent Advice Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Daily Smart recommendation section */}
              <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-6 shadow-xs border border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 font-bold text-xs px-3 py-1 rounded-full border border-purple-500/10 mb-4">
                    <Sparkles className="h-3.5 w-3.5" />
                    المساعد الصحي الذكي (Gemini AI)
                  </span>
                  <h3 className="text-xl font-bold mb-3">هل تودين توليد خطة نصائح وتوقعات مخصصة لليوم؟</h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    يقوم محرك الذكاء الاصطناعي بتحليل تاريخ قياسات الضغط، السكر، الوزن، ومعدل خطواتك البدنية الأسبوعية ليصيغ لكِ خطة إرشادية آمنة متكاملة في ثوانٍ.
                  </p>
                  
                  <button
                    id="patient-btn-generate-ai"
                    onClick={() => {
                      setActiveTab('tips');
                      handleGenerateAITips();
                    }}
                    className="bg-white text-slate-900 hover:bg-slate-50 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                    تحليل البيانات وتوليد النصائح الآن
                  </button>
                </div>
                <div className="absolute left-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
                  <Sparkles className="w-64 h-64 text-white" />
                </div>
              </div>

              {/* Latest Doctors Advice Log Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  آخر توجيهات الطبيب
                </h3>
                
                {advices.length > 0 ? (
                  <div className="space-y-4">
                    {advices.slice(0, 2).map(advice => (
                      <div key={advice.id} className="border-r-4 border-emerald-500 bg-slate-50 p-3.5 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1.5 font-bold text-slate-800">
                          <span>{advice.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{new Date(advice.timestamp).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed line-clamp-3">{advice.content}</p>
                        <div className="mt-2 text-right">
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">بواسطة: {advice.doctorName}</span>
                        </div>
                      </div>
                    ))}
                    <button 
                      id="patient-link-tips"
                      onClick={() => setActiveTab('tips')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center mt-3 cursor-pointer"
                    >
                      شاهد جميع النصائح والوصفات الطبية
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">لا توجد توصيات من الطبيب حتى الآن.</p>
                )}
              </div>

            </div>

            {/* Micro Charts Previews (Prompt 4 - dashboard with quick graph overview) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">نظرة عامة على نشاطك وضغط دمك الأسبوعي</h3>
                  <p className="text-xs text-slate-400">رسم بياني سريع لمراقبة ثبات القراءات الأخيرة</p>
                </div>
                <button 
                  id="patient-btn-view-charts"
                  onClick={() => setActiveTab('charts')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  عرض المخططات التفصيلية
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Simple Custom SVG Sparkline-like representation for Blood Pressure */}
              <div className="h-48 border border-slate-100 rounded-xl bg-slate-50/50 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs text-slate-400 px-2">
                  <span>القراءة (ملم زئبقي)</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span> الانقباضي Systolic</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span> الانبساطي Diastolic</span>
                  </div>
                </div>
                
                {/* SVG Line chart representing the blood pressure */}
                <div className="flex-1 relative mt-3">
                  <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                    {/* Normal range guideline shading (90-120) */}
                    <rect x="0" y="30" width="600" height="40" fill="rgba(16, 185, 129, 0.04)" />
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                    
                    {/* Systolic Line (Rose color) */}
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      points="50,65 150,72 250,58 350,78 450,45 550,55"
                      strokeLinecap="round"
                    />
                    {/* Diastolic Line (Blue color) */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      points="50,90 150,95 250,88 350,98 450,76 550,82"
                      strokeLinecap="round"
                    />

                    {/* Data Points */}
                    <circle cx="50" cy="65" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                    <circle cx="150" cy="72" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                    <circle cx="250" cy="58" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                    <circle cx="350" cy="78" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                    <circle cx="450" cy="45" r="6" fill="#be123c" stroke="white" strokeWidth="2" /> {/* High warning */}
                    <circle cx="550" cy="55" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />

                    <circle cx="50" cy="90" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                    <circle cx="150" cy="95" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                    <circle cx="250" cy="88" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                    <circle cx="350" cy="98" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                    <circle cx="450" cy="76" r="6" fill="#1d4ed8" stroke="white" strokeWidth="2" /> {/* High warning */}
                    <circle cx="550" cy="82" r="5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 px-4 mt-1 border-t border-slate-100 pt-2">
                  <span>السبت (27/6)</span>
                  <span>الأحد (28/6)</span>
                  <span>الإثنين (29/6)</span>
                  <span>الثلاثاء (30/6)</span>
                  <span>الأربعاء (1/7)</span>
                  <span>اليوم (3/7)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: NEW READING
            ========================================== */}
        {activeTab === 'new_reading' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Plus className="h-5.5 w-5.5 text-emerald-500" />
              تسجيل قياس حيوي جديد لليوم
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              سجل قياسك وسيقوم النظام بتصنيفه طبياً وتوليد تحذيرات فورية في حال عدم مطابقة المعايير الطبية للـ HIPAA.
            </p>

            <form onSubmit={handleSubmitReading} className="space-y-6">
              
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">نوع المؤشر الحيوي</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'blood_pressure', label: 'ضغط الدم', icon: Heart },
                    { id: 'blood_sugar', label: 'سكر الدم', icon: Activity },
                    { id: 'weight', label: 'الوزن', icon: Scale },
                    { id: 'steps', label: 'الخطوات', icon: Flame },
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = newReadingType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`btn-select-type-${item.id}`}
                        onClick={() => setNewReadingType(item.id as any)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Sub-form Inputs based on selected type */}
              {newReadingType === 'blood_pressure' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الضغط الانقباضي (Systolic)</label>
                    <input 
                      type="number" 
                      id="input-bp-systolic"
                      value={systolic} 
                      onChange={e => setSystolic(e.target.value)} 
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-center font-bold"
                      placeholder="120"
                      min="50"
                      max="250"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 text-center">الرقم العلوي (مثالي: 120)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الضغط الانبساطي (Diastolic)</label>
                    <input 
                      type="number" 
                      id="input-bp-diastolic"
                      value={diastolic} 
                      onChange={e => setDiastolic(e.target.value)} 
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-center font-bold"
                      placeholder="80"
                      min="30"
                      max="150"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 text-center">الرقم السفلي (مثالي: 80)</span>
                  </div>
                </div>
              )}

              {newReadingType === 'blood_sugar' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-sugar-fasting"
                      onClick={() => setSugarTestType('fasting')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        sugarTestType === 'fasting' 
                          ? 'bg-emerald-600 text-white border-transparent' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      قبل الفطور (صيام)
                    </button>
                    <button
                      type="button"
                      id="btn-sugar-random"
                      onClick={() => setSugarTestType('random')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        sugarTestType === 'random' 
                          ? 'bg-emerald-600 text-white border-transparent' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      عشوائي / بعد الأكل
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">قيمة قياس السكر (ملغ / ديسيلتر)</label>
                    <input 
                      type="number" 
                      id="input-sugar-value"
                      value={sugarValue} 
                      onChange={e => setSugarValue(e.target.value)} 
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-center font-bold"
                      placeholder="100"
                      min="20"
                      max="600"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 text-center">
                      {sugarTestType === 'fasting' ? 'المعدل الطبيعي للصيام: أقل من 100 ملغ/ديسيلتر' : 'المعدل الطبيعي العشوائي: أقل من 140 ملغ/ديسيلتر'}
                    </span>
                  </div>
                </div>
              )}

              {newReadingType === 'weight' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوزن الحالي بالكيلوغرام (kg)</label>
                  <input 
                    type="number" 
                    id="input-weight-value"
                    value={weightValue} 
                    onChange={e => setWeightValue(e.target.value)} 
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-center font-bold"
                    placeholder="75.0"
                    step="0.1"
                    min="10"
                    max="300"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 text-center">سيقوم النظام بتحديث مؤشر كتلة الجسم (BMI) تلقائياً</span>
                </div>
              )}

              {newReadingType === 'steps' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1">عدد الخطوات المسجلة اليوم</label>
                  <input 
                    type="number" 
                    id="input-steps-count"
                    value={stepsCount} 
                    onChange={e => setStepsCount(e.target.value)} 
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-center font-bold"
                    placeholder="6000"
                    min="0"
                    max="100000"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 text-center">المستهدف الصحي الموصى به يومياً: 10,000 خطوة</span>
                </div>
              )}

              {/* General notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ملاحظات ومشاعر مصاحبة (اختياري)</label>
                <textarea
                  id="input-reading-notes"
                  value={readingNotes}
                  onChange={e => setReadingNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="مثال: أشعر بصداع بسيط، بعد الغداء بساعتين..."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                id="btn-submit-reading"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm"
              >
                حفظ القراءة وإدراجها في السجل
              </button>

            </form>

            {/* Form feedback notification inside the layout */}
            <AnimatePresence>
              {formSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs text-center"
                >
                  <p className="font-bold flex items-center justify-center gap-1">
                    <Check className="h-4.5 w-4.5" />
                    {formSuccessMessage}
                  </p>
                </motion.div>
              )}

              {formAlertMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
                >
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                    تنبيه صحي فوري:
                  </p>
                  <p>{formAlertMessage.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==========================================
            TAB: HISTORY TABLE
            ========================================== */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">سجل المؤشرات والقياسات التاريخي</h3>
                <p className="text-xs text-slate-400">تصفح وفلترة كامل القياسات المدخلة مسبقاً</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'blood_pressure', label: 'الضغط' },
                  { id: 'blood_sugar', label: 'السكر' },
                  { id: 'weight', label: 'الوزن' },
                  { id: 'steps', label: 'الخطوات' },
                ].map(item => (
                  <button
                    key={item.id}
                    id={`btn-filter-history-${item.id}`}
                    onClick={() => setHistoryFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      historyFilter === item.id 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Table of historical records */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold">
                    <th className="p-4">نوع القياس</th>
                    <th className="p-4">تاريخ ووقت التسجيل</th>
                    <th className="p-4">قيمة القراءة حيوياً</th>
                    <th className="p-4">التصنيف الطبي</th>
                    <th className="p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {readings
                    .filter(r => historyFilter === 'all' || r.type === historyFilter)
                    .map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-4 font-bold flex items-center gap-2">
                          {r.type === 'blood_pressure' && <><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> ضغط الدم</>}
                          {r.type === 'blood_sugar' && <><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> سكر الدم</>}
                          {r.type === 'weight' && <><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> الوزن</>}
                          {r.type === 'steps' && <><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> النشاط الرياضي</>}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(r.timestamp).toLocaleString('ar-SA')}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {r.type === 'blood_pressure' && `${r.systolic}/${r.diastolic} ملم زئبقي`}
                          {r.type === 'blood_sugar' && `${r.sugarValue} ملغ/ديسيلتر (${r.sugarTestType === 'fasting' ? 'صيام' : 'عشوائي'})`}
                          {r.type === 'weight' && `${r.weightValue} كغم`}
                          {r.type === 'steps' && `${r.stepsCount?.toLocaleString()} خطوة`}
                        </td>
                        <td className="p-4 text-xs">
                          {r.type === 'blood_pressure' && (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getBPStatus(r.systolic || 120, r.diastolic || 80).color}`}>
                              {getBPStatus(r.systolic || 120, r.diastolic || 80).label}
                            </span>
                          )}
                          {r.type === 'blood_sugar' && (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getSugarStatus(r.sugarValue || 100, r.sugarTestType || 'fasting').color}`}>
                              {getSugarStatus(r.sugarValue || 100, r.sugarTestType || 'fasting').label}
                            </span>
                          )}
                          {r.type === 'weight' && patientData?.profile && (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${getBMIStatus(r.weightValue || 70, patientData.profile.height).color}`}>
                              {getBMIStatus(r.weightValue || 70, patientData.profile.height).label}
                            </span>
                          )}
                          {r.type === 'steps' && (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${getStepsStatus(r.stepsCount || 0).color}`}>
                              {getStepsStatus(r.stepsCount || 0).label}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-500 max-w-xs truncate">
                          {r.notes || '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {readings.filter(r => historyFilter === 'all' || r.type === historyFilter).length === 0 && (
                <p className="text-sm text-slate-400 py-8 text-center bg-slate-50">لا توجد سجلات مطابقة لهذه الفئة حالياً.</p>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: DETAILED INTERACTIVE CHARTS
            ========================================== */}
        {activeTab === 'charts' && (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Blood Sugar Chart Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="font-bold text-slate-900">منحنى مستوى السكر في الدم (صيام)</h4>
                  <span className="text-xs text-slate-400">الحد الأقصى الطبيعي للصيام: 100 ملغ/ديسيلتر</span>
                </div>
                <div className="h-44 bg-slate-50 rounded-xl p-4 flex flex-col justify-between">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Fasting prediabetes line shading (100) */}
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                    {/* Diabetic line shading (126) */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />

                    {/* Sugar Line (Amber color) */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      points="40,30 120,15 200,48 280,25 360,60 440,50"
                      strokeLinecap="round"
                    />
                    {/* Data Points */}
                    <circle cx="40" cy="30" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                    <circle cx="120" cy="15" r="5" fill="#ef4444" stroke="white" strokeWidth="2" /> {/* High Fasting Warning */}
                    <circle cx="200" cy="48" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                    <circle cx="280" cy="25" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                    <circle cx="360" cy="60" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                    <circle cx="440" cy="50" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-slate-400 px-2 border-t border-slate-100 pt-2">
                    <span>27/6 (112)</span>
                    <span>28/6 (135 ⚠️)</span>
                    <span>29/6 (128)</span>
                    <span>1/7 (95 ✅)</span>
                    <span>2/7 (105)</span>
                    <span>اليوم (102)</span>
                  </div>
                </div>
              </div>

              {/* Weight Loss Progress Trend Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="font-bold text-slate-900">مؤشر التقدم في تخفيف الوزن</h4>
                  <span className="text-xs text-slate-400">معدل الانخفاض الحالي: -2.2 كغم خلال أسبوعين</span>
                </div>
                <div className="h-44 bg-slate-50 rounded-xl p-4 flex flex-col justify-between">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Target weight line (75) */}
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />

                    {/* Weight decline Line (Blue color) */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3.5"
                      points="50,20 250,45 450,70"
                      strokeLinecap="round"
                    />
                    {/* Data Points */}
                    <circle cx="50" cy="20" r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <circle cx="250" cy="45" r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <circle cx="450" cy="70" r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-slate-400 px-6 border-t border-slate-100 pt-2">
                    <span>20/6 (80.2 كغم)</span>
                    <span>27/6 (79.1 كغم)</span>
                    <span>اليوم (78.0 كغم)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Core Health Risk Score Assessment (Prompt 3) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">تقييم درجة المخاطر الصحية الإجمالية (Risk Score)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يتم احتساب درجة المخاطر الصحية الإجمالية بناءً على المعايير الصحية لـ WHO ومطابقة المؤشرات الطبية المختلفة.
                    درجة المخاطر الحالية للمريضة مصنفة كـ <strong>"مستقرة تحت الرقابة"</strong> مع استقرار ضغط الدم والسكر الصيام.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 font-bold">سكر صائم: مستقر (102)</span>
                    <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-100 font-bold">ضغط دم: مرتفع خفيف (130/82)</span>
                    <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded border border-indigo-100 font-bold">النشاط البدني: نشط</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center flex flex-col items-center justify-center shrink-0 w-full sm:w-48">
                  <span className="text-xs text-slate-400 font-bold mb-1">درجة المخاطر</span>
                  <div className="relative flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-amber-500">22%</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full mt-2 uppercase">مخاطر منخفضة</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: SMART TIPS / AI REC
            ========================================== */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            
            {/* Advice generating panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                    المساعد الصحي والتحليلات الذكية (Prompt 3)
                  </h3>
                  <p className="text-xs text-slate-400">توليد نصائح طبية مخصصة استناداً لقراءاتك الحالية باستخدام خوارزميات الذكاء الاصطناعي</p>
                </div>
                <button
                  id="patient-btn-ai-reload"
                  onClick={handleGenerateAITips}
                  disabled={isLoadingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                  توليد نصائح جديدة
                </button>
              </div>

              {isLoadingAI ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 font-bold">جاري مراجعة وتحليل قياساتك الحيوية مع Gemini 3.5 Flash...</p>
                  <p className="text-[11px] text-slate-400 text-center max-w-sm">نقوم بالتحقق من ضغط الدم، السكري، الـ BMI ومعدل خطواتك لصياغة توجيهات غذائية وعلاجية مخصصة.</p>
                </div>
              ) : aiResponse ? (
                <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-6 text-sm text-slate-800 leading-relaxed space-y-4">
                  <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                    <Sparkles className="h-3 w-3" />
                    تم التوليد بواسطة الذكاء الاصطناعي الطبي
                  </span>
                  
                  {/* Clean line formatting */}
                  <div className="prose max-w-none text-slate-700 space-y-3">
                    {aiResponse.split('\n').map((line, idx) => {
                      if (line.startsWith('###')) {
                        return <h4 key={idx} className="text-base font-bold text-slate-900 mt-4 border-r-4 border-indigo-600 pr-2">{line.replace('###', '').trim()}</h4>;
                      }
                      if (line.startsWith('*') || line.startsWith('-')) {
                        return <li key={idx} className="mr-4 list-disc text-slate-600 mt-1">{line.replace(/^[\s*-]+/, '').trim()}</li>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <h5 key={idx} className="font-bold text-slate-800 mt-3 text-indigo-900">{line}</h5>;
                      }
                      return <p key={idx} className="text-slate-600">{line}</p>;
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-500 mb-4 font-bold">انقر فوق الزر أعلاه للبدء في توليد تقرير النصائح والتحليلات الذكية لليوم.</p>
                  <button
                    id="patient-btn-ai-init"
                    onClick={handleGenerateAITips}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-5 py-3 rounded-xl border border-indigo-200 transition-all shadow-sm"
                  >
                    توليد تقرير التوجيهات الطبي الذكي
                  </button>
                </div>
              )}
            </div>

            {/* Doctors Advice History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">أرشيف النصائح المعتمدة من الطبيب المعالج</h3>
              <div className="space-y-4">
                {advices.map(advice => (
                  <div key={advice.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:border-slate-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">{advice.title}</span>
                      <span className="text-[11px] text-slate-400">{new Date(advice.timestamp).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{advice.content}</p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">بواسطة: <strong>{advice.doctorName}</strong></span>
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">{advice.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: CHAT / MESSAGING WITH DOCTOR
            ========================================== */}
        {activeTab === 'chat' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[550px]">
            
            {/* Chat header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150" 
                  alt="د. خالد" 
                  className="w-10 h-10 rounded-full object-cover border"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">د. خالد السامرائي</h4>
                  <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                    متصل الآن للرد على الاستفسارات
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded">العيادة تتابع القياسات تلقائياً</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.map(msg => {
                const isMe = msg.senderId === patientId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-150 rounded-bl-none'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[9px] block mt-1.5 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input 
                type="text" 
                id="input-chat-message"
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="اكتب استفسارك الطبي للدكتور هنا..." 
                className="flex-1 bg-slate-100 text-xs px-4 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent focus:border-indigo-200"
              />
              <button 
                type="submit" 
                id="btn-chat-send"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all"
              >
                <Send className="h-4.5 w-4.5 rotate-180" />
              </button>
            </form>

          </div>
        )}

        {/* ==========================================
            TAB: SMART DEVICES
            ========================================== */}
        {activeTab === 'devices' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">الأجهزة الطبية والذكية المتصلة (Prompt 2 & 4)</h3>
              <p className="text-xs text-slate-400">تحسين تتبع السكري والضغط عبر المزامنة التلقائية مع أجهزتك المفضلة</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {devices.map(device => (
                <div key={device.id} className="border border-slate-100 hover:border-slate-200 transition-all rounded-xl p-5 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-indigo-600 shadow-sm">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{device.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">العلامة التجارية: {device.brand}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">آخر مزامنة: {new Date(device.lastSynced).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>

                  <button
                    id={`btn-sync-device-${device.id}`}
                    onClick={() => handleSyncDevice(device.id)}
                    disabled={isSyncingDevice === device.id}
                    className="flex items-center gap-1 text-[11px] font-bold bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingDevice === device.id ? 'animate-spin' : ''}`} />
                    مزامنة الآن
                  </button>
                </div>
              ))}
            </div>

            {/* Quick simulated device addition form */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h4 className="font-bold text-slate-800 text-xs mb-3">🔗 هل تريد ربط جهاز قياس ذكي جديد؟</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  id="btn-add-device-apple"
                  onClick={() => {
                    fetch(`/api/patients/${patientId}/devices`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'مقياس الوزن الذكي (Withings Body)', brand: 'Withings', type: 'scale' })
                    }).then(() => fetchData());
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border text-xs text-slate-600 py-3 rounded-lg font-bold"
                >
                  ربط مقياس وزن ذكي
                </button>
                <button
                  id="btn-add-device-fitbit"
                  onClick={() => {
                    fetch(`/api/patients/${patientId}/devices`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'سوار النشاط الرياضي (Fitbit Charge)', brand: 'Fitbit', type: 'smartwatch' })
                    }).then(() => fetchData());
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border text-xs text-slate-600 py-3 rounded-lg font-bold"
                >
                  ربط سوار رياضي (Fitbit)
                </button>
                <button
                  id="btn-add-device-glucometer"
                  onClick={() => {
                    fetch(`/api/patients/${patientId}/devices`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'مستشعر السكر المستمر (Dexcom G7)', brand: 'Dexcom', type: 'glucometer' })
                    }).then(() => fetchData());
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border text-xs text-slate-600 py-3 rounded-lg font-bold"
                >
                  ربط مستشعر سكر مستمر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SUBSCRIPTION & PLAN
            ========================================== */}
        {activeTab === 'subscription' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900">إدارة باقة الاشتراك والدفع والفوترة (Prompt 2 & 4)</h3>
              <p className="text-xs text-slate-400">بوابتك الصحية الآمنة للترقية والخدمات المدعومة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Free Plan */}
              <div className="border border-slate-200 rounded-2xl p-5 text-center flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-xs font-bold block mb-1">الباقة الأساسية</span>
                  <h4 className="font-extrabold text-xl text-slate-800">مجاناً</h4>
                  <ul className="text-xs text-slate-500 space-y-2 my-6 text-right pr-4">
                    <li>✓ تتبع المؤشرات الأساسية يدوياً</li>
                    <li>✓ ربط جهاز ذكي واحد فقط</li>
                    <li>✓ إرسال 5 رسائل شهرياً للطبيب</li>
                  </ul>
                </div>
                <button 
                  id="btn-upgrade-free"
                  disabled 
                  className="w-full bg-slate-100 text-slate-400 font-bold py-2 px-3 rounded-lg text-xs"
                >
                  الخيار الافتراضي
                </button>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-indigo-500 rounded-2xl p-5 text-center flex flex-col justify-between relative bg-indigo-50/5">
                <span className="absolute top-[-12px] right-[20px] bg-indigo-600 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">الموصى بها</span>
                <div>
                  <span className="text-indigo-600 text-xs font-bold block mb-1">الباقة المتقدمة (Pro)</span>
                  <h4 className="font-extrabold text-xl text-indigo-950">29.99 ريال / شهر</h4>
                  <ul className="text-xs text-indigo-900/80 space-y-2 my-6 text-right pr-4">
                    <li>✓ تتبع غير محدود لكافة المؤشرات الحيوية</li>
                    <li>✓ ربط غير محدود للأجهزة والأساور الذكية</li>
                    <li>✓ تحليلات ذكية وتوصيات فورية عبر Gemini AI</li>
                    <li>✓ مراسلة مفتوحة ومباشرة مع طبيبك المعالج</li>
                  </ul>
                </div>
                <button
                  id="btn-upgrade-pro"
                  onClick={() => handleUpgradePlan('pro')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    subscription?.plan === 'pro' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {subscription?.plan === 'pro' ? 'باقتك النشطة الحالية' : 'ترقية الاشتراك الآن'}
                </button>
              </div>

              {/* Premium Plan */}
              <div className="border border-slate-200 rounded-2xl p-5 text-center flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-xs font-bold block mb-1">الذهبية العائلية</span>
                  <h4 className="font-extrabold text-xl text-slate-800">59.99 ريال / شهر</h4>
                  <ul className="text-xs text-slate-500 space-y-2 my-6 text-right pr-4">
                    <li>✓ كافة مميزات الباقة المتقدمة (Pro)</li>
                    <li>✓ دعم ربط لغاية 4 أفراد من العائلة لحساب واحد</li>
                    <li>✓ تنبيهات طوارئ عاجلة عبر الـ SMS والاتصال للأسرة</li>
                    <li>✓ تقارير دورية موقعة من الاستشاريين شهرياً</li>
                  </ul>
                </div>
                <button
                  id="btn-upgrade-premium"
                  onClick={() => handleUpgradePlan('premium')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    subscription?.plan === 'premium' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {subscription?.plan === 'premium' ? 'باقتك النشطة الحالية' : 'ترقية الاشتراك الآن'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB: MEDICAL COMPREHENSIVE REPORT (Prompt 4)
            ========================================== */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl mx-auto space-y-8" id="printable-report-area">
            
            {/* Report Toolbars (Non-printable) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
              <div>
                <h3 className="text-lg font-bold text-slate-900">تصدير التقرير الطبي الشامل للمريض</h3>
                <p className="text-xs text-slate-400">تقرير سريري معتمد يشمل التاريخ المرضي والمؤشرات الحيوية والتوصيات.</p>
              </div>
              <button
                id="btn-print-report"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow transition-all"
              >
                <Printer className="h-4 w-4" />
                طباعة / تصدير PDF
              </button>
            </div>

            {/* Simulated Printed medical report sheet */}
            <div className="border border-slate-300 rounded-xl p-8 bg-white relative text-slate-900 shadow">
              
              {/* Report Header Logo & Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-800 pb-6 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 text-white p-2.5 rounded-lg">
                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-950">مستشفى الاستشاريين الموحد</h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Integrated Medical EHR Center</span>
                  </div>
                </div>
                <div className="text-left font-mono text-[11px] text-slate-500" dir="ltr">
                  <p>REPORT ID: EHR-2026-09823</p>
                  <p>DATE: {new Date().toLocaleDateString('en-US')}</p>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-center text-lg font-bold border-b border-slate-200 pb-2 mb-6">تقرير طبي سريري شامل وموجز (Clinical Summary Report)</h2>

              {/* Patient Basic Profile Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                <div>
                  <span className="text-slate-400 block mb-0.5">اسم المريض:</span>
                  <strong className="text-slate-900">{patientData?.name || 'مريم أحمد العتيبي'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">العمر / الجنس:</span>
                  <strong className="text-slate-900">{patientData?.profile?.age} سنة / {patientData?.profile?.gender === 'female' ? 'أنثى' : 'ذكر'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الوزن / الطول:</span>
                  <strong className="text-slate-900">{patientData?.profile?.weight} كغم / {patientData?.profile?.height} سم</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">فصيلة الدم:</span>
                  <strong className="text-slate-900">{patientData?.profile?.bloodType}</strong>
                </div>
              </div>

              {/* Patient Chronics and History */}
              <div className="space-y-4 mb-6 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">الأمراض والمشكلات الطبية المشخصة:</span>
                  <p className="bg-slate-50 p-3 rounded border text-slate-700 leading-relaxed">
                    {patientData?.profile?.chronicConditions?.join('، ') || 'ارتفاع ضغط الدم، السكري من النوع الثاني'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">التاريخ المرضي العام ووصف العلاج الدوائي:</span>
                  <p className="bg-slate-50 p-3 rounded border text-slate-700 leading-relaxed">
                    {patientData?.profile?.medicalHistory}
                  </p>
                </div>
              </div>

              {/* Historical Readings Summary */}
              <div className="mb-6">
                <span className="font-bold text-slate-900 text-xs block mb-2">أحدث المؤشرات والقياسات الحيوية المستقرة في النظام:</span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 rounded p-3">
                    <span className="text-slate-500 font-bold block mb-1">ضغط الدم الأخير:</span>
                    <strong>{latestBP ? `${latestBP.systolic}/${latestBP.diastolic} ملم زئبقي` : 'غير متوفر'}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">المعدل الطبيعي: أقل من 120/80</span>
                  </div>
                  <div className="border border-slate-200 rounded p-3">
                    <span className="text-slate-500 font-bold block mb-1">سكر الدم (صيام):</span>
                    <strong>{latestSugar ? `${latestSugar.sugarValue} ملغ/ديسيلتر` : 'غير متوفر'}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">المعدل الطبيعي للصيام: أقل من 100</span>
                  </div>
                </div>
              </div>

              {/* Doctor sign & advice */}
              <div className="border-t border-slate-200 pt-6 mt-8">
                <div className="flex justify-between items-start text-xs gap-6">
                  <div>
                    <span className="text-slate-400 block mb-1">الطبيب الاستشاري المسؤول عن الحالة:</span>
                    <strong className="text-slate-950">د. خالد السامرائي</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">استشاري الباطنية والغدد الصماء - ترخيص SCHS-2021-98765</p>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block mb-2">الختم الطبي والتوقيع المعتمد:</span>
                    <div className="w-24 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center font-serif text-[10px] text-indigo-800 font-bold opacity-85 select-none" dir="ltr">
                      APPROVED EHR
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
