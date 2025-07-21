import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadedFile {
  filename: string;
  url: string;
  path: string;
  uploadedAt: Date;
  size: number;
}

/**
 * ファイルをFirebase Storageにアップロード
 */
export async function uploadFileToStorage(
  file: File | Blob, 
  username: string, 
  filename: string
): Promise<UploadedFile> {
  const storageRef = ref(storage, `cosplayers/${username}/${filename}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  return {
    filename,
    url: downloadUrl,
    path: snapshot.ref.fullPath,
    uploadedAt: new Date(),
    size: snapshot.metadata.size || 0
  };
}

/**
 * ローカルファイルをFirebase Storageにアップロード
 */
export async function uploadLocalFileToStorage(
  localPath: string,
  username: string,
  filename: string
): Promise<UploadedFile> {
  // Node.js環境でのファイル読み込み
  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(localPath);
  
  const blob = new Blob([fileBuffer]);
  return uploadFileToStorage(blob, username, filename);
}

/**
 * 特定ユーザーの全ファイルを取得
 */
export async function getUserFiles(username: string): Promise<UploadedFile[]> {
  const userRef = ref(storage, `cosplayers/${username}`);
  
  try {
    const result = await listAll(userRef);
    const files: UploadedFile[] = [];
    
    for (const itemRef of result.items) {
      const url = await getDownloadURL(itemRef);
      const metadata = await getMetadata(itemRef);
      
      files.push({
        filename: itemRef.name,
        url,
        path: itemRef.fullPath,
        uploadedAt: new Date(metadata.timeCreated),
        size: metadata.size || 0
      });
    }
    
    return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  } catch (error) {
    console.error(`Error fetching files for ${username}:`, error);
    return [];
  }
}

/**
 * ファイルを削除
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
}

/**
 * ユーザーの全ファイルを削除
 */
export async function deleteUserFiles(username: string): Promise<void> {
  const userRef = ref(storage, `cosplayers/${username}`);
  const result = await listAll(userRef);
  
  const deletePromises = result.items.map(itemRef => deleteObject(itemRef));
  await Promise.all(deletePromises);
} 