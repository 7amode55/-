/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  User, 
  PatientProfile, 
  DoctorProfile, 
  HealthReading, 
  Advice, 
  Alert, 
  Subscription, 
  ConnectedDevice, 
  MedicalMessage,
  ClinicStats
} from './src/types.js';

dotenv.config();

// Init express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client safely (lazy-initialization as per constraints)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log('Gemini client initialized successfully server-side.');
    } catch (err) {
      console.error('Failed to initialize Gemini client:', err);
    }
  }
  return aiClient;
}

// ==========================================
// MOCK DATABASE & STATE (In-Memory)
// ==========================================

const mockUsers: User[] = [
  {
    id: 'user_patient_1',
    name: 'مريم أحمد العتيبي',
    email: 'maryam@example.com',
    role: 'patient',
    phone: '+966 50 123 4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user_doctor_1',
    name: 'د. خالد السامرائي',
    email: 'dr.khaled@clinic.com',
    role: 'doctor',
    phone: '+966 55 987 6543',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    createdAt: '2025-10-01T09:00:00Z',
  },
  {
    id: 'user_patient_2',
    name: 'عبد الرحمن بن علي',
    email: 'abdurahman@example.com',
    role: 'patient',
    phone: '+966 53 456 7890',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'user_nurse_1',
    name: 'سارة الدوسري (ممرضة)',
    email: 'sara.nurse@clinic.com',
    role: 'nurse',
    phone: '+966 56 111 2222',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    createdAt: '2025-12-01T08:30:00Z',
  }
];

const mockPatientProfiles: Record<string, PatientProfile> = {
  'user_patient_1': {
    userId: 'user_patient_1',
    age: 45,
    gender: 'female',
    bloodType: 'A+',
    height: 162,
    weight: 78,
    chronicConditions: ['ارتفاع ضغط الدم', 'السكري من النوع الثاني'],
    medicalHistory: 'تم تشخيص ضغط الدم في عام 2022، والسكري في عام 2024. تتبع حمية غذائية قليلة الأملاح والسكريات وتأخذ ميتفورمين 500 ملغ مرتين يومياً.',
    emergencyContact: 'أحمد العتيبي (زوج) - +966 50 111 2222',
  },
  'user_patient_2': {
    userId: 'user_patient_2',
    age: 62,
    gender: 'male',
    bloodType: 'O+',
    height: 175,
    weight: 85,
    chronicConditions: ['ارتفاع ضغط الدم', 'خشونة الركبة'],
    medicalHistory: 'يعاني من ارتفاع ضغط الدم المزمن منذ 10 سنوات، يأخذ أملوديبين 5 ملغ يومياً. خضع لمنظار الركبة اليسرى في عام 2023.',
    emergencyContact: 'علي بن علي (ابن) - +966 53 222 3333',
  }
};

const mockDoctorProfiles: Record<string, DoctorProfile> = {
  'user_doctor_1': {
    userId: 'user_doctor_1',
    specialty: 'استشاري أمراض الباطنية والغدد الصماء',
    clinicName: 'عيادة الاستشاريين التخصصية',
    clinicAddress: 'طريق الملك فهد، الرياض، المملكة العربية السعودية',
    licenseNumber: 'SCHS-2021-98765',
  }
};

// Seed historical readings spanning the last 7 days
let mockReadings: HealthReading[] = [
  // Patient 1 - Blood Pressure (Recent high and normal values)
  { id: 'r1', patientId: 'user_patient_1', timestamp: '2026-06-27T08:00:00Z', type: 'blood_pressure', systolic: 135, diastolic: 85, notes: 'بعد المشي الخفيف' },
  { id: 'r2', patientId: 'user_patient_1', timestamp: '2026-06-28T08:30:00Z', type: 'blood_pressure', systolic: 142, diastolic: 92, notes: 'قبل الفطور، شعور بصداع خفيف' }, // abnormal
  { id: 'r3', patientId: 'user_patient_1', timestamp: '2026-06-29T08:00:00Z', type: 'blood_pressure', systolic: 128, diastolic: 82, notes: 'بعد أخذ العلاج بـ ساعتين' },
  { id: 'r4', patientId: 'user_patient_1', timestamp: '2026-06-30T09:00:00Z', type: 'blood_pressure', systolic: 148, diastolic: 96, notes: 'أشعر بضغط العمل والتوتر' }, // critical high
  { id: 'r5', patientId: 'user_patient_1', timestamp: '2026-07-01T08:00:00Z', type: 'blood_pressure', systolic: 125, diastolic: 79, notes: 'قراءة ممتازة بعد الراحة والالتزام بالحمية' },
  { id: 'r6', patientId: 'user_patient_1', timestamp: '2026-07-02T08:15:00Z', type: 'blood_pressure', systolic: 132, diastolic: 84, notes: 'قراءة صباحية' },
  { id: 'r7', patientId: 'user_patient_1', timestamp: '2026-07-03T08:00:00Z', type: 'blood_pressure', systolic: 130, diastolic: 82, notes: 'قراءة مستقرة' },

  // Patient 1 - Blood Sugar (Fasting and Random)
  { id: 'r8', patientId: 'user_patient_1', timestamp: '2026-06-27T07:30:00Z', type: 'blood_sugar', sugarValue: 112, sugarTestType: 'fasting', notes: 'صيام 8 ساعات' }, // prediabetic
  { id: 'r9', patientId: 'user_patient_1', timestamp: '2026-06-28T07:30:00Z', type: 'blood_sugar', sugarValue: 135, sugarTestType: 'fasting', notes: 'صيام، البارحة تناولت عشاء متأخر ومقلي' }, // diabetic / high
  { id: 'r10', patientId: 'user_patient_1', timestamp: '2026-06-29T21:00:00Z', type: 'blood_sugar', sugarValue: 178, sugarTestType: 'random', notes: 'بعد العشاء بـ ساعتين' },
  { id: 'r11', patientId: 'user_patient_1', timestamp: '2026-06-30T07:30:00Z', type: 'blood_sugar', sugarValue: 128, sugarTestType: 'fasting', notes: 'صيام' },
  { id: 'r12', patientId: 'user_patient_1', timestamp: '2026-07-01T07:30:00Z', type: 'blood_sugar', sugarValue: 95, sugarTestType: 'fasting', notes: 'صيام، قراءة مثالية بعد الالتزام' },
  { id: 'r13', patientId: 'user_patient_1', timestamp: '2026-07-02T07:30:00Z', type: 'blood_sugar', sugarValue: 105, sugarTestType: 'fasting', notes: 'صيام' },
  { id: 'r14', patientId: 'user_patient_1', timestamp: '2026-07-03T07:30:00Z', type: 'blood_sugar', sugarValue: 102, sugarTestType: 'fasting', notes: 'صيام اليوم' },

  // Patient 1 - Weight Tracker
  { id: 'r15', patientId: 'user_patient_1', timestamp: '2026-06-20T08:00:00Z', type: 'weight', weightValue: 80.2 },
  { id: 'r16', patientId: 'user_patient_1', timestamp: '2026-06-27T08:00:00Z', type: 'weight', weightValue: 79.1, notes: 'بدأت ألاحظ نزول في الوزن مع الحمية والمشي' },
  { id: 'r17', patientId: 'user_patient_1', timestamp: '2026-07-03T08:00:00Z', type: 'weight', weightValue: 78.0, notes: 'الوزن الأخير لليوم' },

  // Patient 1 - Steps (Physical Activity)
  { id: 'r18', patientId: 'user_patient_1', timestamp: '2026-06-27T21:00:00Z', type: 'steps', stepsCount: 4200, notes: 'يوم خامل قليلاً' },
  { id: 'r19', patientId: 'user_patient_1', timestamp: '2026-06-28T21:00:00Z', type: 'steps', stepsCount: 6500, notes: 'مشي مسائي حول الحديقة' },
  { id: 'r20', patientId: 'user_patient_1', timestamp: '2026-06-29T21:00:00Z', type: 'steps', stepsCount: 8200, notes: 'مشي ممتاز' },
  { id: 'r21', patientId: 'user_patient_1', timestamp: '2026-06-30T21:00:00Z', type: 'steps', stepsCount: 2100, notes: 'كنت متعبة ومجهدة فلم أمشِ كثيراً' }, // abnormal low activity
  { id: 'r22', patientId: 'user_patient_1', timestamp: '2026-07-01T21:00:00Z', type: 'steps', stepsCount: 11200, notes: 'أفضل نشاط بدني هذا الأسبوع!' },
  { id: 'r23', patientId: 'user_patient_1', timestamp: '2026-07-02T21:00:00Z', type: 'steps', stepsCount: 7400 },
  { id: 'r24', patientId: 'user_patient_1', timestamp: '2026-07-03T16:00:00Z', type: 'steps', stepsCount: 5200, notes: 'حتى الآن اليوم' },

  // Patient 2 - Readings
  { id: 'r25', patientId: 'user_patient_2', timestamp: '2026-07-01T09:00:00Z', type: 'blood_pressure', systolic: 138, diastolic: 88 },
  { id: 'r26', patientId: 'user_patient_2', timestamp: '2026-07-02T09:00:00Z', type: 'blood_pressure', systolic: 145, diastolic: 92 }, // high
  { id: 'r27', patientId: 'user_patient_2', timestamp: '2026-07-03T09:00:00Z', type: 'blood_pressure', systolic: 155, diastolic: 98 }, // danger high
  { id: 'r28', patientId: 'user_patient_2', timestamp: '2026-07-03T09:15:00Z', type: 'steps', stepsCount: 3100 },
];

// Seed Alerts
let mockAlerts: Alert[] = [
  {
    id: 'a1',
    patientId: 'user_patient_1',
    patientName: 'مريم أحمد العتيبي',
    readingId: 'r4',
    type: 'blood_pressure',
    severity: 'red_danger',
    message: 'تنبيه حرج: ارتفاع شديد في ضغط الدم (148/96 ملم زئبقي). الرجاء أخذ قسط من الراحة وإعادة القياس.',
    timestamp: '2026-06-30T09:05:00Z',
    isAcknowledged: false,
  },
  {
    id: 'a2',
    patientId: 'user_patient_1',
    patientName: 'مريم أحمد العتيبي',
    readingId: 'r9',
    type: 'blood_sugar',
    severity: 'yellow_warning',
    message: 'تحذير: سكر صيام مرتفع (135 ملغ/ديسيلتر). راقب وجباتك والتزم بالعلاج والجرعة المحددة.',
    timestamp: '2026-06-28T07:35:00Z',
    isAcknowledged: true,
  },
  {
    id: 'a3',
    patientId: 'user_patient_2',
    patientName: 'عبد الرحمن بن علي',
    readingId: 'r27',
    type: 'blood_pressure',
    severity: 'red_danger',
    message: 'تنبيه حرج: ضغط دم مرتفع جداً (155/98 ملم زئبقي) للمريض عبد الرحمن بن علي. يستدعي التواصل والتدخل الطبي.',
    timestamp: '2026-07-03T09:05:00Z',
    isAcknowledged: false,
  }
];

// Seed Advices (Doctor Recommendations)
let mockAdvices: Advice[] = [
  {
    id: 'ad1',
    patientId: 'user_patient_1',
    doctorId: 'user_doctor_1',
    doctorName: 'د. خالد السامرائي',
    title: 'توجيهات علاجية لمستوى السكر والضغط',
    content: 'يرجى مراجعة قياسات الضغط اليومية. تم تغيير موعد جرعة الأملوديبين لتكون مساءً بدلاً من صباحاً لتفادي الارتفاعات الصباحية. يرجى الاستمرار في المشي 30 دقيقة يومياً وتجنب الدهون والأملاح.',
    category: 'medication',
    timestamp: '2026-07-01T11:00:00Z',
  },
  {
    id: 'ad2',
    patientId: 'user_patient_1',
    doctorId: 'user_doctor_1',
    doctorName: 'د. خالد السامرائي',
    title: 'خطة غذائية متكاملة لتقليل الكربوهيدرات',
    content: 'ممتاز جداً النزول الأخير في الوزن (78 كغم). للحفاظ على وتيرة التحسن، نوصي باستبدال الخبز الأبيض بالخبز الأسمر، وتقسيم الوجبات إلى 5 وجبات صغيرة، والتركيز على الخضروات الورقية والبروتينات الخفيفة.',
    category: 'nutrition',
    timestamp: '2026-06-25T13:30:00Z',
  },
  {
    id: 'ad3',
    patientId: 'user_patient_1',
    doctorId: 'system_ai',
    doctorName: 'المساعد الذكي (الذكاء الاصطناعي)',
    title: 'تحليل أسبوعي لنشاطك البدني والمؤشرات',
    content: 'بناءً على قياسات الأسبوع الأخير، لوحظ ارتفاع في معدل خطواتك اليومية بمتوسط 6,400 خطوة مقارنة بالأسبوع الماضي. هذا التحسن انعكس إيجاباً على انخفاض متوسط قراءة السكر الصباحية بنسبة 8%. واصلي هذا الأداء الرائع!',
    category: 'lifestyle',
    timestamp: '2026-07-02T19:00:00Z',
    isAISuggestion: true,
  }
];

// Seed Messages
let mockMessages: MedicalMessage[] = [
  { id: 'm1', senderId: 'user_patient_1', receiverId: 'user_doctor_1', content: 'السلام عليكم دكتور خالد، قمت بإدخال قياس الضغط اليوم وكان مرتفعاً قليلاً (142/92). هل أحتاج لزيادة الجرعة؟', timestamp: '2026-06-28T09:00:00Z', isRead: true },
  { id: 'm2', senderId: 'user_doctor_1', receiverId: 'user_patient_1', content: 'وعليكم السلام يا مريم. لا تقلقي، يبدو أن هناك تشنجاً أو توتراً بسيطاً. خذي قسطاً كافياً من النوم الليلة والتزمي بجرعتك المعتادة. إذا تكررت القراءة فوق 145 غداً صباحاً، تواصلي معي.', timestamp: '2026-06-28T10:15:00Z', isRead: true },
  { id: 'm3', senderId: 'user_patient_1', receiverId: 'user_doctor_1', content: 'الحمد لله دكتور، اليوم القياس ممتاز (125/79). شكراً جزيلاً لاهتمامك.', timestamp: '2026-07-01T08:30:00Z', isRead: true },
  { id: 'm4', senderId: 'user_patient_1', receiverId: 'user_doctor_1', content: 'دكتور، قمت بشراء جهاز قياس السكر المنزلي الجديد وربطته مع التطبيق وهو يعمل بشكل رائع ويقوم بالمزامنة تلقائياً.', timestamp: '2026-07-03T11:30:00Z', isRead: false },
];

// Seed Connected Devices
let mockDevices: ConnectedDevice[] = [
  { id: 'd1', patientId: 'user_patient_1', name: 'ساعة آبل الذكية (Series 9)', brand: 'Apple', type: 'smartwatch', status: 'connected', lastSynced: '2026-07-03T16:00:00Z' },
  { id: 'd2', patientId: 'user_patient_1', name: 'جهاز ضغط الدم الذكي (Omron Connect)', brand: 'Omron', type: 'bp_monitor', status: 'connected', lastSynced: '2026-07-03T08:00:00Z' },
  { id: 'd3', patientId: 'user_patient_1', name: 'مقياس السكر الذكي (Accu-Chek Guide)', brand: 'Accu-Chek', type: 'glucometer', status: 'connected', lastSynced: '2026-07-03T07:30:00Z' },
  { id: 'd4', patientId: 'user_patient_2', name: 'جهاز ضغط الدم الذكي (Omron Connect)', brand: 'Omron', type: 'bp_monitor', status: 'connected', lastSynced: '2026-07-03T09:00:00Z' },
];

// Seed Subscriptions
let mockSubscriptions: Subscription[] = [
  { id: 'sub1', userId: 'user_patient_1', plan: 'pro', status: 'active', startDate: '2026-05-01T00:00:00Z', endDate: '2026-11-01T00:00:00Z', price: 29.99 },
  { id: 'sub2', userId: 'user_doctor_1', plan: 'clinic_pro', status: 'active', startDate: '2025-10-01T00:00:00Z', endDate: '2026-10-01T00:00:00Z', price: 199.99 },
];

// ==========================================
// CORE LOGIC & ALGORITHMS (Prompt 3)
// ==========================================

// Helper to evaluate health readings and trigger alerts
function processReadingSafety(reading: HealthReading): Alert | null {
  const patient = mockUsers.find(u => u.id === reading.patientId);
  const patientName = patient ? patient.name : 'مريض مجهول';
  
  if (reading.type === 'blood_pressure') {
    const sys = reading.systolic || 120;
    const dia = reading.diastolic || 80;
    
    if (sys > 140 || dia > 90) {
      return {
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        patientId: reading.patientId,
        patientName,
        readingId: reading.id,
        type: 'blood_pressure',
        severity: 'red_danger',
        message: `تنبيه حرج: تم تسجيل ضغط دم مرتفع جداً (${sys}/${dia} ملم زئبقي). ننصح بأخذ قسط من الراحة فوراً وتجنب المجهود والتوتر وإعادة القياس، ومراجعة الطبيب في حال استمرار الارتفاع.`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      };
    } else if (sys > 120 || dia > 80) {
      return {
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        patientId: reading.patientId,
        patientName,
        readingId: reading.id,
        type: 'blood_pressure',
        severity: 'yellow_warning',
        message: `تحذير: ضغط الدم (${sys}/${dia} ملم زئبقي) أعلى من المعدل الطبيعي قليلاً. يُنصح بالالتزام بالحمية وتقليل الأملاح ومتابعة القياسات.`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      };
    } else if (sys < 90 || dia < 60) {
      return {
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        patientId: reading.patientId,
        patientName,
        readingId: reading.id,
        type: 'blood_pressure',
        severity: 'yellow_warning',
        message: `تحذير: ضغط دم منخفض (${sys}/${dia} ملم زئبقي). ننصح بشرب كميات كافية من السوائل والراحة وتناول وجبة خفيفة ومستقرة.`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      };
    }
  }

  if (reading.type === 'blood_sugar') {
    const val = reading.sugarValue || 100;
    const testType = reading.sugarTestType || 'fasting';
    
    if (testType === 'fasting') {
      if (val >= 126) {
        return {
          id: 'alert_' + Math.random().toString(36).substring(2, 9),
          patientId: reading.patientId,
          patientName,
          readingId: reading.id,
          type: 'blood_sugar',
          severity: 'red_danger',
          message: `تنبيه حرج: مستوى سكر صيام مرتفع جداً (${val} ملغ/ديسيلتر). هذا يشير لارتفاع حاد في السكر ويتطلب مراجعة الطبيب وتعديل جرعات الأنسولين أو الدواء.`,
          timestamp: new Date().toISOString(),
          isAcknowledged: false
        };
      } else if (val >= 100) {
        return {
          id: 'alert_' + Math.random().toString(36).substring(2, 9),
          patientId: reading.patientId,
          patientName,
          readingId: reading.id,
          type: 'blood_sugar',
          severity: 'yellow_warning',
          message: `تحذير: مستوى سكر صيام (${val} ملغ/ديسيلتر) يشير لحالة (ما قبل السكري). ننصح بتنظيم الكربوهيدرات والسكريات والمشي اليومي.`,
          timestamp: new Date().toISOString(),
          isAcknowledged: false
        };
      }
    } else { // random sugar
      if (val >= 200) {
        return {
          id: 'alert_' + Math.random().toString(36).substring(2, 9),
          patientId: reading.patientId,
          patientName,
          readingId: reading.id,
          type: 'blood_sugar',
          severity: 'red_danger',
          message: `تنبيه حرج: مستوى السكر العشوائي مرتفع جداً (${val} ملغ/ديسيلتر). يرجى تقليل استهلاك السكر وتناول كمية كافية من الماء ومتابعة الطبيب فوراً.`,
          timestamp: new Date().toISOString(),
          isAcknowledged: false
        };
      }
    }
    
    if (val < 70) {
      return {
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        patientId: reading.patientId,
        patientName,
        readingId: reading.id,
        type: 'blood_sugar',
        severity: 'red_danger',
        message: `تنبيه حرج: هبوط حاد في مستوى السكر (${val} ملغ/ديسيلتر). ننصح فوراً بتناول نصف كوب عصير محلى أو 3 قطع سكر لتفادي الإغماء وإعادة القياس بعد 15 دقيقة.`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      };
    }
  }

  if (reading.type === 'steps') {
    const steps = reading.stepsCount || 5000;
    if (steps < 2000) {
      return {
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        patientId: reading.patientId,
        patientName,
        readingId: reading.id,
        type: 'steps',
        severity: 'yellow_warning',
        message: `تحذير: نشاط بدني شديد الخمول اليوم (${steps} خطوة). يرجى ممارسة المشي الخفيف لتحسين الدورة الدموية ومستويات السكر والضغط.`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      };
    }
  }

  return null;
}

// ==========================================
// API ENDPOINTS (Prompt 7)
// ==========================================

// Authentication API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Quick pre-set login for simulation
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    res.json({ success: true, user });
  } else {
    // If unknown, login as patient 1 or doctor 1 depending on query or default
    if (email.includes('doctor')) {
      res.json({ success: true, user: mockUsers[1] });
    } else if (email.includes('nurse')) {
      res.json({ success: true, user: mockUsers[3] });
    } else {
      res.json({ success: true, user: mockUsers[0] });
    }
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role, phone, age, gender, height, weight, bloodType, chronicConditions } = req.body;
  const newUserId = 'user_' + role + '_' + Math.random().toString(36).substring(2, 9);
  
  const newUser: User = {
    id: newUserId,
    name: name || 'مستخدم جديد',
    email: email || 'new@example.com',
    role: (role as any) || 'patient',
    phone: phone || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  
  if (newUser.role === 'patient') {
    mockPatientProfiles[newUserId] = {
      userId: newUserId,
      age: Number(age) || 30,
      gender: gender || 'female',
      bloodType: bloodType || 'O+',
      height: Number(height) || 170,
      weight: Number(weight) || 70,
      chronicConditions: chronicConditions || [],
      medicalHistory: 'سجل طبي جديد تم إنشاؤه عند التسجيل.',
      emergencyContact: 'جهة اتصال طوارئ غير محددة',
    };
  } else if (newUser.role === 'doctor') {
    mockDoctorProfiles[newUserId] = {
      userId: newUserId,
      specialty: 'استشاري أمراض الباطنية والصحة العامة',
      clinicName: 'المجمع الطبي العام',
      clinicAddress: 'الرياض، المملكة العربية السعودية',
      licenseNumber: 'SCHS-' + Math.floor(Math.random() * 100000),
    };
  }
  
  res.status(201).json({ success: true, user: newUser });
});

// Patient endpoints
app.get('/api/patients', (req, res) => {
  // Return all patients with profiles merged
  const patients = mockUsers.filter(u => u.role === 'patient').map(patient => {
    const profile = mockPatientProfiles[patient.id] || {
      userId: patient.id,
      age: 40,
      gender: 'female',
      bloodType: 'O+',
      height: 165,
      weight: 75,
      chronicConditions: [],
      medicalHistory: '',
      emergencyContact: '',
    };
    return { ...patient, profile };
  });
  res.json(patients);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = mockUsers.find(u => u.id === req.params.id && u.role === 'patient');
  if (!patient) {
    return res.status(404).json({ error: 'المريض غير موجود' });
  }
  const profile = mockPatientProfiles[patient.id] || null;
  res.json({ ...patient, profile });
});

app.put('/api/patients/:id', (req, res) => {
  const { name, phone, age, gender, bloodType, height, weight, chronicConditions, medicalHistory } = req.body;
  const userIdx = mockUsers.findIndex(u => u.id === req.params.id);
  
  if (userIdx !== -1) {
    if (name) mockUsers[userIdx].name = name;
    if (phone) mockUsers[userIdx].phone = phone;
    
    const profile = mockPatientProfiles[req.params.id];
    if (profile) {
      if (age) profile.age = Number(age);
      if (gender) profile.gender = gender;
      if (bloodType) profile.bloodType = bloodType;
      if (height) profile.height = Number(height);
      if (weight) profile.weight = Number(weight);
      if (chronicConditions) profile.chronicConditions = chronicConditions;
      if (medicalHistory) profile.medicalHistory = medicalHistory;
    }
    res.json({ success: true, user: mockUsers[userIdx], profile: mockPatientProfiles[req.params.id] });
  } else {
    res.status(404).json({ error: 'المريض غير موجود' });
  }
});

// Readings Endpoints
app.get('/api/patients/:id/readings', (req, res) => {
  const readings = mockReadings.filter(r => r.patientId === req.params.id);
  // sort by timestamp descending
  readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(readings);
});

app.post('/api/patients/:id/readings', (req, res) => {
  const { type, systolic, diastolic, sugarValue, sugarTestType, weightValue, stepsCount, notes, timestamp } = req.body;
  
  const newReading: HealthReading = {
    id: 'r_' + Math.random().toString(36).substring(2, 9),
    patientId: req.params.id,
    timestamp: timestamp || new Date().toISOString(),
    type,
    notes,
    systolic: systolic ? Number(systolic) : undefined,
    diastolic: diastolic ? Number(diastolic) : undefined,
    sugarValue: sugarValue ? Number(sugarValue) : undefined,
    sugarTestType: sugarTestType || undefined,
    weightValue: weightValue ? Number(weightValue) : undefined,
    stepsCount: stepsCount ? Number(stepsCount) : undefined,
  };
  
  mockReadings.push(newReading);
  
  // Update weight in profile if weight reading is submitted
  if (type === 'weight' && weightValue) {
    const profile = mockPatientProfiles[req.params.id];
    if (profile) {
      profile.weight = Number(weightValue);
    }
  }

  // Check safety and automatically trigger alert if out of bounds
  const generatedAlert = processReadingSafety(newReading);
  if (generatedAlert) {
    mockAlerts.unshift(generatedAlert);
  }
  
  res.status(201).json({ success: true, reading: newReading, alertTriggered: generatedAlert });
});

// Alerts endpoints
app.get('/api/patients/:id/alerts', (req, res) => {
  const alerts = mockAlerts.filter(a => a.patientId === req.params.id);
  res.json(alerts);
});

app.get('/api/alerts', (req, res) => {
  res.json(mockAlerts);
});

app.put('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = mockAlerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.isAcknowledged = true;
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ error: 'التنبيه غير موجود' });
  }
});

// Doctor advices / recommendations endpoints
app.get('/api/patients/:id/advice', (req, res) => {
  const advices = mockAdvices.filter(a => a.patientId === req.params.id);
  advices.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(advices);
});

app.post('/api/patients/:id/advice', (req, res) => {
  const { title, content, category, doctorId, doctorName, isAISuggestion } = req.body;
  
  const newAdvice: Advice = {
    id: 'ad_' + Math.random().toString(36).substring(2, 9),
    patientId: req.params.id,
    doctorId: doctorId || 'user_doctor_1',
    doctorName: doctorName || 'د. خالد السامرائي',
    title: title || 'نصيحة طبية',
    content: content || '',
    category: category || 'general',
    timestamp: new Date().toISOString(),
    isAISuggestion: !!isAISuggestion,
  };
  
  mockAdvices.unshift(newAdvice);
  res.status(201).json({ success: true, advice: newAdvice });
});

// Medical Messages endpoints (Doctor <-> Patient)
app.get('/api/messages/:user1/:user2', (req, res) => {
  const { user1, user2 } = req.params;
  const messages = mockMessages.filter(
    m => (m.senderId === user1 && m.receiverId === user2) || 
         (m.senderId === user2 && m.receiverId === user1)
  );
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, content } = req.body;
  
  const newMessage: MedicalMessage = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    senderId,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  
  mockMessages.push(newMessage);
  res.status(201).json({ success: true, message: newMessage });
});

app.put('/api/messages/read-all', (req, res) => {
  const { senderId, receiverId } = req.body;
  mockMessages.forEach(m => {
    if (m.senderId === senderId && m.receiverId === receiverId) {
      m.isRead = true;
    }
  });
  res.json({ success: true });
});

// Devices endpoints
app.get('/api/patients/:id/devices', (req, res) => {
  const devices = mockDevices.filter(d => d.patientId === req.params.id);
  res.json(devices);
});

app.post('/api/patients/:id/devices', (req, res) => {
  const { name, brand, type } = req.body;
  const newDevice: ConnectedDevice = {
    id: 'dev_' + Math.random().toString(36).substring(2, 9),
    patientId: req.params.id,
    name,
    brand,
    type,
    status: 'connected',
    lastSynced: new Date().toISOString(),
  };
  mockDevices.push(newDevice);
  res.status(201).json({ success: true, device: newDevice });
});

app.post('/api/patients/:id/devices/:deviceId/sync', (req, res) => {
  const device = mockDevices.find(d => d.id === req.params.deviceId && d.patientId === req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'الجهاز غير موجود' });
  }
  
  device.lastSynced = new Date().toISOString();
  device.status = 'connected';
  
  // Simulate synchronizing steps or a blood pressure reading
  let generatedReading: HealthReading | null = null;
  if (device.type === 'smartwatch') {
    generatedReading = {
      id: 'r_sync_' + Math.random().toString(36).substring(2, 9),
      patientId: req.params.id,
      timestamp: new Date().toISOString(),
      type: 'steps',
      stepsCount: Math.floor(Math.random() * 5000) + 5000,
      notes: `مزامنة تلقائية من ${device.name}`
    };
    mockReadings.push(generatedReading);
  } else if (device.type === 'glucometer') {
    generatedReading = {
      id: 'r_sync_' + Math.random().toString(36).substring(2, 9),
      patientId: req.params.id,
      timestamp: new Date().toISOString(),
      type: 'blood_sugar',
      sugarValue: Math.floor(Math.random() * 40) + 90,
      sugarTestType: 'random',
      notes: `مزامنة تلقائية من ${device.name}`
    };
    mockReadings.push(generatedReading);
  } else if (device.type === 'bp_monitor') {
    generatedReading = {
      id: 'r_sync_' + Math.random().toString(36).substring(2, 9),
      patientId: req.params.id,
      timestamp: new Date().toISOString(),
      type: 'blood_pressure',
      systolic: Math.floor(Math.random() * 20) + 115,
      diastolic: Math.floor(Math.random() * 10) + 75,
      notes: `مزامنة تلقائية من ${device.name}`
    };
    mockReadings.push(generatedReading);
  }

  let generatedAlert: Alert | null = null;
  if (generatedReading) {
    generatedAlert = processReadingSafety(generatedReading);
    if (generatedAlert) {
      mockAlerts.unshift(generatedAlert);
    }
  }

  res.json({ success: true, syncedReading: generatedReading, alertTriggered: generatedAlert });
});

// Clinic management endpoints (Prompt 5)
app.get('/api/clinic/stats', (req, res) => {
  const activeAlerts = mockAlerts.filter(a => !a.isAcknowledged).length;
  const stats: ClinicStats = {
    totalPatients: mockUsers.filter(u => u.role === 'patient').length,
    totalDoctors: mockUsers.filter(u => u.role === 'doctor').length,
    activeAlerts,
    monthlyRevenue: 2850, // simulated
    recentLogs: [
      { id: 'l1', action: 'تسجيل قراءة ضغط دم', user: 'مريم أحمد العتيبي', timestamp: 'منذ 5 دقائق' },
      { id: 'l2', action: 'إنشاء تنبيه طبي حرج', user: 'عبد الرحمن بن علي', timestamp: 'منذ ساعة' },
      { id: 'l3', action: 'إرسال توجيهات علاجية', user: 'د. خالد السامرائي', timestamp: 'منذ ساعتين' },
      { id: 'l4', action: 'تجديد اشتراك باقة عيادة', user: 'عيادة الاستشاريين التخصصية', timestamp: 'منذ يوم' }
    ]
  };
  res.json(stats);
});

// Patient Subscriptions API
app.get('/api/patients/:id/subscription', (req, res) => {
  const sub = mockSubscriptions.find(s => s.userId === req.params.id);
  if (sub) {
    res.json(sub);
  } else {
    // default free plan
    res.json({
      id: 'sub_free',
      userId: req.params.id,
      plan: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      price: 0
    });
  }
});

app.post('/api/patients/:id/subscription', (req, res) => {
  const { plan } = req.body;
  const existingIdx = mockSubscriptions.findIndex(s => s.userId === req.params.id);
  
  let price = 0;
  if (plan === 'pro') price = 29.99;
  if (plan === 'premium') price = 59.99;
  if (plan === 'clinic_pro') price = 199.99;

  const newSub: Subscription = {
    id: 'sub_' + Math.random().toString(36).substring(2, 9),
    userId: req.params.id,
    plan,
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
    price,
  };

  if (existingIdx !== -1) {
    mockSubscriptions[existingIdx] = newSub;
  } else {
    mockSubscriptions.push(newSub);
  }

  res.json({ success: true, subscription: newSub });
});

// ==========================================
// GEMINI INTELLIGENT AI HEALTH INSIGHTS API (Prompt 3 & 5)
// ==========================================
app.post('/api/gemini/generate-tips', async (req, res) => {
  const { patientId } = req.body;
  
  const patient = mockUsers.find(u => u.id === patientId);
  const profile = mockPatientProfiles[patientId];
  const readings = mockReadings.filter(r => r.patientId === patientId).slice(0, 10);
  
  if (!patient || !profile) {
    return res.status(404).json({ error: 'المريض أو الملف الشخصي غير موجود' });
  }

  // Format historical metrics to pass to Gemini
  const formattedReadings = readings.map(r => {
    if (r.type === 'blood_pressure') return `ضغط دم: ${r.systolic}/${r.diastolic} ملم زئبقي بتاريخ ${r.timestamp.split('T')[0]}`;
    if (r.type === 'blood_sugar') return `سكر دم (${r.sugarTestType === 'fasting' ? 'صيام' : 'عشوائي'}): ${r.sugarValue} ملغ/ديسيلتر بتاريخ ${r.timestamp.split('T')[0]}`;
    if (r.type === 'weight') return `الوزن: ${r.weightValue} كغم بتاريخ ${r.timestamp.split('T')[0]}`;
    if (r.type === 'steps') return `خطوات: ${r.stepsCount} خطوات بتاريخ ${r.timestamp.split('T')[0]}`;
    return '';
  }).filter(Boolean).join('\n');

  // Rule-based fallback tips (Prompt 3 criteria)
  const defaultTips = [
    `مستوى الضغط الأخير مستقر نسبياً، واصلي الالتزام بجرعات الدواء في أوقاتها الدقيقة وتجنبي مصادر التوتر.`,
    `بما أنكِ تعانين من السكري من النوع الثاني، فإن الالتزام بـ 150 دقيقة من المشي المعتدل أسبوعياً (مثلاً 30 دقيقة يومياً لـ 5 أيام) يساعد في زيادة حساسية الخلايا للأنسولين وخفض سكر الصيام بشكل ملحوظ.`,
    `مؤشر كتلة جسمك الحالي (BMI) هو ${((profile.weight / Math.pow(profile.height / 100, 2))).toFixed(1)}. هذا يصنف كـ "زيادة في الوزن/سمنة خفيفة". ننصح بوضع هدف واقعي لنزول الوزن بنسبة 5% خلال 3 أشهر لتحسين الضغط والسكري بشكل كبير.`,
    `ينصح بتقليل الأطعمة الغنية بالصوديوم (الأملاح) إلى أقل من 2000 ملغ يومياً، واستبدال الأطعمة سريعة الامتصاص (الخبز الأبيض والأرز الأبيض) بالحبوب الكاملة والألياف.`
  ];

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `أنت طبيب استشاري وخبير ذكاء اصطناعي طبي تتحدث اللغة العربية بأسلوب ودود ومهني وواضح جداً ومطمئن للمريض.
بناءً على البيانات الصحية التالية للمريضة:
الاسم: ${patient.name}
العمر: ${profile.age} سنة
الأمراض المزمنة: ${profile.chronicConditions.join(' و ')}
التاريخ الطبي والجرعات: ${profile.medicalHistory}
الوزن الحالي: ${profile.weight} كغم، الطول: ${profile.height} سم

القراءات الأخيرة المسجلة:
${formattedReadings}

المعايير الصحية العالمية:
- ضغط الدم: منخفض <90/60، طبيعي 90-120/60-80، مرتفع خفيف 121-139/81-89، مرتفع خطير >=140/90
- السكر: صيام طبيعي <100، ما قبل السكري 100-125، سكري >=126
- BMI: نحافة <18.5، طبيعي 18.5-25، زيادة وزن 25-30، سمنة مفرطة >=30
- النشاط: قليل <5000 خطوة، متوسط 5000-10000، ممتاز >10000

أرجو منك تقديم 4 نصائح وتوصيات ذكية ومخصصة باللغة العربية الفصحى للمريضة:
1. نصيحة مخصصة للتحكم بضغط الدم بناءً على قراءاتها الأخيرة وجرعاتها.
2. نصيحة مخصصة لمستويات السكر ووجباتها.
3. نصيحة بخصوص الوزن والـ BMI الحالي ومعدل خطواتها البدنية اليومية.
4. توقع أو تحليل اتجاهات بسيط (Trend prediction) مطمئن بناء على تقدمها الأخير (مثلاً نزول وزنها المستمر).

اكتب التوصيات كنقاط واضحة ومباشرة وقابلة للتطبيق العملي بدون إطالة أو تعقيد وبخط عريض للعنوان الفرعي لكل نقطة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      if (response && response.text) {
        // split by double newlines or lines to send clean items
        const rawText = response.text;
        // Parse and return back the text
        return res.json({ success: true, aiGenerated: true, insights: rawText });
      }
    } catch (err) {
      console.error('Error generating AI Insights with Gemini:', err);
    }
  }

  // Fallback if Gemini failed or is not configured
  const fallbackMarkdown = `### 🩺 نصائح المساعد الذكي الطبية (بناءً على التوصيات الصحية العالمية):

1. **📊 تنظيم ضغط الدم وتفادي الارتفاعات**:
   * لوحظ تذبذب في قياسات الضغط مؤخراً (بين 125/79 و148/96). يوصى بالالتزام الصارم بموعد العلاج الجديد في المساء، وتجنب الوجبات المملحة أو الغنية بالصوديوم، والراحة التامة لمدة 5 دقائق قبل أخذ أي قراءات جديدة.

2. **🍬 السيطرة على السكري من النوع الثاني**:
   * مستويات سكر الصيام مستقرة في حدود 102-105 ملغ/ديسيلتر وهي مستويات ممتازة جداً وقريبة من النطاق الطبيعي. استمري في الصيام لـ 8 ساعات قبل التحليل، وتجنبي تناول النشويات البسيطة والسكريات في العشاء متأخراً لتفادي ارتفاع الصباح.

3. **⚖️ الوزن ومؤشر كتلة الجسم (BMI)**:
   * مؤشر كتلة جسمك الحالي هو **${((profile.weight / Math.pow(profile.height / 100, 2))).toFixed(1)}** (زيادة في الوزن). نزول وزنك الأخير من 80.2 إلى 78.0 كغم هو إنجاز استثنائي ومحفز كبير! يساهم خسارة 2 كغم إضافية في زيادة حساسية الأنسولين بنسبة 15%.

4. **🏃‍♂️ النشاط البدني والحركة اليومية**:
   * خطواتك في الأيام الجيدة تصل إلى 11,200 خطوة وهي ممتازة، ولكنها تنخفض في أيام التعب إلى 2,100 خطوة. حاولي المحافظة على معدل ثابت بمتوسط 6,000 خطوة يومياً لتنشيط عضلة القلب وضبط ضغط الدم بشكل طبيعي.`;

  res.json({ success: true, aiGenerated: false, insights: fallbackMarkdown });
});

// ==========================================
// VITE AND STATIC ASSETS MIDDLEWARE
// ==========================================
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer().catch(err => {
  console.error('Failed to start server:', err);
});
