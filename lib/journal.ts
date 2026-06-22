import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, setDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { RiskSettings, TradeReview, PlaybookSetup } from "@/types/trade";

// ── Helpers ────────────────────────────────────────────────────
const userDoc   = (uid: string) => doc(db, "users", uid);
const reviewCol = (uid: string) => collection(db, "users", uid, "reviews");
const reviewDoc = (uid: string, id: string) => doc(db, "users", uid, "reviews", id);
const setupCol  = (uid: string) => collection(db, "users", uid, "playbook");
const setupDoc  = (uid: string, id: string) => doc(db, "users", uid, "playbook", id);

function fromTs(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return (v as string) || "";
}

// ── Risk Settings ──────────────────────────────────────────────
export async function getRiskSettings(uid: string): Promise<RiskSettings | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d?.riskSettings) return null;
  return d.riskSettings as RiskSettings;
}

export async function saveRiskSettings(uid: string, settings: RiskSettings): Promise<void> {
  await setDoc(userDoc(uid), { riskSettings: { ...settings, updatedAt: new Date().toISOString() } }, { merge: true });
}

// ── Trade Reviews ──────────────────────────────────────────────
export async function getReviews(uid: string): Promise<TradeReview[]> {
  const q = query(reviewCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: fromTs(d.data().createdAt),
    updatedAt: fromTs(d.data().updatedAt),
  } as TradeReview));
}

export async function getReview(uid: string, id: string): Promise<TradeReview | null> {
  const snap = await getDoc(reviewDoc(uid, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: fromTs(snap.data().createdAt) } as TradeReview;
}

export async function saveReview(uid: string, review: Omit<TradeReview, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(reviewCol(uid), { ...review, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateReview(uid: string, id: string, review: Partial<TradeReview>): Promise<void> {
  await updateDoc(reviewDoc(uid, id), { ...review, updatedAt: serverTimestamp() });
}

export async function deleteReview(uid: string, id: string): Promise<void> {
  await deleteDoc(reviewDoc(uid, id));
}

// ── Playbook Setups ────────────────────────────────────────────
export async function getSetups(uid: string): Promise<PlaybookSetup[]> {
  const q = query(setupCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: fromTs(d.data().createdAt),
    updatedAt: fromTs(d.data().updatedAt),
  } as PlaybookSetup));
}

export async function getSetup(uid: string, id: string): Promise<PlaybookSetup | null> {
  const snap = await getDoc(setupDoc(uid, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: fromTs(snap.data().createdAt) } as PlaybookSetup;
}

export async function saveSetup(uid: string, setup: Omit<PlaybookSetup, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(setupCol(uid), { ...setup, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateSetup(uid: string, id: string, setup: Partial<PlaybookSetup>): Promise<void> {
  await updateDoc(setupDoc(uid, id), { ...setup, updatedAt: serverTimestamp() });
}

export async function deleteSetup(uid: string, id: string): Promise<void> {
  await deleteDoc(setupDoc(uid, id));
}
