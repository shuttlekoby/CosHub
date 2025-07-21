import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UploadedFile } from './firebaseStorage';

export interface CosplayerData {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  followers?: string;
  mediaCount: number;
  lastUpdated: Date;
  downloadHistory: DownloadHistory[];
}

export interface DownloadHistory {
  date: Date;
  downloadedCount: number;
  totalSize: number;
  status: 'success' | 'error' | 'partial';
  errorMessage?: string;
}

/**
 * コスプレイヤーデータを保存/更新
 */
export async function saveCosplayerData(cosplayerData: Omit<CosplayerData, 'id'>): Promise<void> {
  const docRef = doc(db, 'cosplayers', cosplayerData.username);
  
  await setDoc(docRef, {
    ...cosplayerData,
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

/**
 * コスプレイヤーデータを取得
 */
export async function getCosplayerData(username: string): Promise<CosplayerData | null> {
  const docRef = doc(db, 'cosplayers', username);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
      downloadHistory: data.downloadHistory?.map((h: any) => ({
        ...h,
        date: h.date?.toDate() || new Date()
      })) || []
    } as CosplayerData;
  }
  
  return null;
}

/**
 * 全コスプレイヤーデータを取得
 */
export async function getAllCosplayers(): Promise<CosplayerData[]> {
  const cosplayersRef = collection(db, 'cosplayers');
  const q = query(cosplayersRef, orderBy('lastUpdated', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
    downloadHistory: doc.data().downloadHistory?.map((h: any) => ({
      ...h,
      date: h.date?.toDate() || new Date()
    })) || []
  })) as CosplayerData[];
}

/**
 * ダウンロード履歴を追加
 */
export async function addDownloadHistory(
  username: string, 
  history: Omit<DownloadHistory, 'date'>
): Promise<void> {
  const docRef = doc(db, 'cosplayers', username);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const currentData = docSnap.data();
    const newHistory = {
      ...history,
      date: serverTimestamp()
    };
    
    const downloadHistory = currentData.downloadHistory || [];
    downloadHistory.unshift(newHistory); // 最新を先頭に
    
    // 履歴は最大20件まで保持
    if (downloadHistory.length > 20) {
      downloadHistory.splice(20);
    }
    
    await updateDoc(docRef, {
      downloadHistory,
      mediaCount: history.downloadedCount,
      lastUpdated: serverTimestamp()
    });
  }
}

/**
 * メディア情報を保存
 */
export async function saveMediaInfo(
  username: string, 
  files: UploadedFile[]
): Promise<void> {
  const mediaRef = collection(db, 'media');
  
  const promises = files.map(file => {
    const docId = `${username}_${file.filename}`;
    const docRef = doc(mediaRef, docId);
    
    return setDoc(docRef, {
      username,
      filename: file.filename,
      url: file.url,
      path: file.path,
      size: file.size,
      uploadedAt: serverTimestamp(),
      likes: Math.floor(Math.random() * 2000) + 100, // ランダムないいね数
    });
  });
  
  await Promise.all(promises);
}

/**
 * ユーザーのメディア情報を取得
 */
export async function getUserMedia(username: string): Promise<any[]> {
  const mediaRef = collection(db, 'media');
  const q = query(
    mediaRef, 
    where('username', '==', username),
    orderBy('uploadedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
  }));
}

/**
 * コスプレイヤーデータを削除
 */
export async function deleteCosplayerData(username: string): Promise<void> {
  const docRef = doc(db, 'cosplayers', username);
  await deleteDoc(docRef);
  
  // 関連メディア情報も削除
  const mediaRef = collection(db, 'media');
  const q = query(mediaRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
} 