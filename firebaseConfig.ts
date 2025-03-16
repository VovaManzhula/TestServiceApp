import {getApp, getApps, initializeApp} from '@react-native-firebase/app';
import '@react-native-firebase/firestore';
import '@react-native-firebase/storage';

const firebaseConfig = {
  apiKey: '**********',
  authDomain: '**********',
  projectId: '**********',
  storageBucket: '**********',
  messagingSenderId: '**********',
  appId: '**********',
};

let app: ReturnType<typeof getApp>;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export {app};
