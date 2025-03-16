import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {isImageMimeType} from '../helpers/imageMimeTypes';
import {Request, RootStackParamList, User} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestList'>;

const RequestListScreen: React.FC<Props> = ({navigation}) => {
  const [role, setRole] = useState<'client' | 'provider' | null>(null);
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [providerRequests, setProviderRequests] = useState<Request[]>([]);
  const [inProgressRequests, setInProgressRequests] = useState<Request[]>([]);
  const [user, setUser] = useState<User>({id: '1', role: 'client'});
  const [providerListMode, setProviderListMode] = useState<
    'pending' | 'inProgress'
  >('pending');
  const [providerStats, setProviderStats] = useState<{
    completedTasks: number;
    averageRating: number;
  }>({completedTasks: 0, averageRating: 0});

  useEffect(() => {
    if (!role) {
      return;
    }

    const userId = role === 'client' ? '1' : '2';
    setUser({id: userId, role});
    const db = getFirestore();

    if (role === 'client') {
      const q = query(
        collection(db, 'requests'),
        where('userId', '==', userId),
      );
      const unsubscribe = onSnapshot(q, snapshot => {
        const requestData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Request[];
        setUserRequests(requestData);
      });
      return () => unsubscribe();
    } else if (role === 'provider') {
      const pendingQuery = query(
        collection(db, 'requests'),
        where('status', '==', 'pending'),
      );
      const pendingUnsubscribe = onSnapshot(pendingQuery, snapshot => {
        const requestData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Request[];
        setProviderRequests(requestData);
      });

      const inProgressQuery = query(
        collection(db, 'requests'),
        where('providerId', '==', userId),
        where('status', '==', 'inProgress'),
      );
      const inProgressUnsubscribe = onSnapshot(inProgressQuery, snapshot => {
        const inProgressData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Request[];
        setInProgressRequests(inProgressData);
      });

      const userRef = doc(db, 'users', userId);
      const userUnsubscribe = onSnapshot(userRef, docSnap => {
        if (docSnap.exists) {
          const data = docSnap.data() as User;
          setProviderStats({
            completedTasks: data.completedTasks || 0,
            averageRating: data.averageRating || 0,
          });
        }
      });

      return () => {
        pendingUnsubscribe();
        inProgressUnsubscribe();
        userUnsubscribe();
      };
    }
  }, [role]);

  const handleConfirmExecution = async (requestId: string) => {
    navigation.navigate('RateProvider', {requestId, providerId: '2'});
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const handleAcceptProposal = async (
    requestId: string,
    providerId: string,
  ) => {
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {status: 'inProgress', providerId});
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error accepting proposal:', error);
      Alert.alert('Error', 'Failed to accept the proposal. Please try again.');
    }
  };

  const handleMarkCompleted = async (requestId: string) => {
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {status: 'awaitingСonfirmation'});
    } catch (error) {
      console.error('Error accepting proposal:', error);
    }
  };

  const openProposalsModal = (request: Request) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  const renderItem = ({item}: {item: Request}) => (
    <View style={styles.item}>
      {item.mediaUrl && item.mediaType && (
        <>
          {!isImageMimeType(item.mediaType) ? (
            <Video
              source={{uri: item.mediaUrl}}
              style={styles.video}
              paused={true}
              resizeMode="cover"
            />
          ) : (
            <Image source={{uri: item.mediaUrl}} style={styles.image} />
          )}
        </>
      )}
      <View style={styles.itemDescription}>
        <Text
          style={
            styles.itemText
          }>{`${item.description}\nStatus: ${item.status}`}</Text>
        {item.status === 'pending' && (
          <Text style={styles.proposalsCount}>
            Proposals: {item.proposals?.length || 0}
          </Text>
        )}
        {role === 'provider' && (
          <>
            {item.status === 'pending' && (
              <Button
                title="View Details"
                onPress={() =>
                  navigation.navigate('RequestDetail', {request: item})
                }
              />
            )}
            {item.status === 'inProgress' && (
              <Button
                title="Mark as Completed"
                onPress={() => handleMarkCompleted(item.id)}
              />
            )}
          </>
        )}
        {role === 'client' && item.userId === user.id && (
          <>
            {item.status === 'pending' && (
              <Button
                title="View Proposals"
                onPress={() => openProposalsModal(item)}
              />
            )}
            {item.status === 'awaitingСonfirmation' && (
              <Button
                title="confirm execution"
                onPress={() => handleConfirmExecution(item.id)}
              />
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Proposals</Text>
            {selectedRequest?.proposals?.length ? (
              <FlatList
                data={selectedRequest.proposals}
                keyExtractor={proposal => proposal.id}
                renderItem={({item}) => (
                  <View style={styles.proposalItem}>
                    <Text>{`Price: ${item.price}, Deadline: ${item.deadline}`}</Text>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        handleAcceptProposal(
                          selectedRequest.id,
                          item.providerId,
                        )
                      }>
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text>No proposals yet.</Text>
            )}
            <Button title="Close" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>
      {!role ? (
        <View style={styles.roleButtons}>
          <Button title="Client" onPress={() => setRole('client')} />
          <Button title="Provider" onPress={() => setRole('provider')} />
        </View>
      ) : (
        <>
          {role === 'provider' && (
            <View style={styles.stats}>
              <Text style={styles.statsText}>
                Completed Tasks: {providerStats.completedTasks}
              </Text>
              <Text style={styles.statsText}>
                Average Rating: {providerStats.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
          {role === 'client' && (
            <Button
              title="Add Request"
              onPress={() => navigation.navigate('AddRequest')}
            />
          )}
          {role === 'provider' && (
            <View style={styles.buttonContainer}>
              <Button
                title={`Requests (${providerRequests.length})`}
                onPress={() => setProviderListMode('pending')}
              />
              <Button
                title={`In Progress (${inProgressRequests.length})`}
                onPress={() => setProviderListMode('inProgress')}
              />
            </View>
          )}
          <FlatList
            data={
              role === 'provider'
                ? providerListMode === 'inProgress'
                  ? inProgressRequests
                  : providerRequests
                : userRequests
            }
            renderItem={renderItem}
            keyExtractor={item => item.id + item.status}
          />
          <Button title="Change Role" onPress={() => setRole(null)} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  stats: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
    borderRadius: 5,
  },
  statsText: {
    fontSize: 16,
    marginVertical: 2,
  },
  video: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  item: {
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  proposalsCount: {},
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  itemDescription: {
    justifyContent: 'space-between',
    width: '70%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  proposalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    padding: 5,
    borderRadius: 5,
  },
  acceptButtonText: {
    fontWeight: 'bold',
  },
});

export default RequestListScreen;
