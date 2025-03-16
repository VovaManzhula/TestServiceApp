import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import AddRequestScreen from '../screens/AddRequestScreen';
import RateProviderScreen from '../screens/RateProviderScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import RequestListScreen from '../screens/RequestListScreen';

export type RootStackParamList = {
  RequestList: undefined;
  AddRequest: undefined;
  RequestDetail: {request: Request};
  RateProvider: {requestId: string; providerId: string};
};

export interface Request {
  id: string;
  proposals?: any[];
  description: string;
  category: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: any;
  userId: string;
  status: 'pending' | 'inProgress' | 'awaitingСonfirmation' | 'completed';
  providerId?: string;
}

export interface User {
  id: string;
  role: 'client' | 'provider';
  completedTasks?: number;
  averageRating?: number;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RequestList">
        <Stack.Screen name="RequestList" component={RequestListScreen} />
        <Stack.Screen name="AddRequest" component={AddRequestScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="RateProvider" component={RateProviderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
