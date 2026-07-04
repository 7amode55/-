/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface PatientProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female';
  bloodType: string;
  height: number; // in cm
  weight: number; // in kg (latest)
  chronicConditions: string[]; // e.g., ["ضغط الدم", "السكري"]
  medicalHistory: string;
  emergencyContact: string;
}

export interface DoctorProfile {
  userId: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  licenseNumber: string;
}

export type ReadingType = 'blood_pressure' | 'blood_sugar' | 'weight' | 'steps';

export interface HealthReading {
  id: string;
  patientId: string;
  timestamp: string;
  type: ReadingType;
  notes?: string;
  
  // Specific data fields
  systolic?: number;   // for blood_pressure
  diastolic?: number;  // for blood_pressure
  sugarValue?: number; // for blood_sugar
  sugarTestType?: 'fasting' | 'random'; // for blood_sugar
  weightValue?: number; // for weight
  stepsCount?: number;  // for steps
}

export interface Advice {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  title: string;
  content: string;
  category: 'nutrition' | 'medication' | 'exercise' | 'lifestyle' | 'general';
  timestamp: string;
  isAISuggestion?: boolean;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  readingId?: string;
  type: ReadingType | 'critical';
  severity: 'red_danger' | 'yellow_warning' | 'normal';
  message: string;
  timestamp: string;
  isAcknowledged: boolean;
}

export type SubscriptionPlan = 'free' | 'pro' | 'premium' | 'clinic_pro';

export interface Subscription {
  id: string;
  userId: string; // patient or doctor
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'canceled';
  startDate: string;
  endDate: string;
  price: number;
}

export interface ConnectedDevice {
  id: string;
  patientId: string;
  name: string; // e.g., "Apple Watch Series 9", "Fitbit Charge 6", "Accu-Chek Sugar Meter"
  brand: string;
  type: 'smartwatch' | 'bp_monitor' | 'glucometer' | 'scale';
  status: 'connected' | 'disconnected';
  lastSynced: string;
}

export interface MedicalMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ClinicStats {
  totalPatients: number;
  totalDoctors: number;
  activeAlerts: number;
  monthlyRevenue: number;
  recentLogs: Array<{ id: string; action: string; user: string; timestamp: string }>;
}
