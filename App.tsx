import React from 'react';
import {app} from './firebaseConfig';
import AppNavigation from './src/navigation/AppNavigation';

const App: React.FC = () => {
  console.log('Firebase initialized:', !!app);

  return <AppNavigation />;
};

export default App;
