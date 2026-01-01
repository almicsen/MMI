declare module 'firebase/storage' {
  export interface FirebaseStorage {}
  export function getStorage(app?: unknown, bucketUrl?: string): FirebaseStorage;
}
