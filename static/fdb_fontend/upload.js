import { getStorage, ref, uploadBytes, getDownloadURL } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-storage.min.js"
import { firebaseApp } from "./firestore_config.js"

console.log(firebaseApp)

const storage = getStorage(firebaseApp);
const metadata = {
  contentType: 'image/jpeg'
};

export function uploadImage(image) {
  const storageRef = ref(storage, `image/${new Date().getTime()}.jpg`);
    
  return new Promise((resolve, reject) => {
    uploadBytes(storageRef, image, metadata).then((snapshot) => {
      console.log('Uploaded a blob or file!', snapshot);
      getDownloadURL(snapshot.ref).then((downloadURL) => {
        resolve(downloadURL)
      });
    });
  })
}