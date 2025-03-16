import {getApp, getApps, initializeApp} from '@react-native-firebase/app';
import '@react-native-firebase/firestore';
import '@react-native-firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBw4Lzbym7In9ocMoaePESXdNcDFQaM0Gc',
  authDomain: 'test-project-service-app.firebaseapp.com',
  projectId: 'test-project-service-app',
  storageBucket: 'test-project-service-app.firebasestorage.app',
  messagingSenderId: '574911594886',
  appId: '1:574911594886:android:8bfb3469e061f499e02c07',
};

let app: ReturnType<typeof getApp>;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export {app};
