import {
  arrayUnion,
  doc,
  getFirestore,
  updateDoc,
} from '@react-native-firebase/firestore';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {isImageMimeType} from '../helpers/imageMimeTypes';
import {RootStackParamList} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

const RequestDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {request} = route.params;
  const [price, setPrice] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  const submitProposal = async () => {
    const db = getFirestore();

    try {
      await updateDoc(doc(db, 'requests', request.id), {
        proposals: arrayUnion({
          price,
          deadline,
          comment,
          providerId: '2',
          createdAt: Date.now(),
        }),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      Alert.alert('Error', 'Failed to submit proposal. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{request.description}</Text>
      <Text style={styles.text}>{request.category}</Text>
      <Text style={styles.text}>Status: {request.status}</Text>
      {request.mediaUrl && request.mediaType && (
        <>
          {!isImageMimeType(request.mediaType) ? (
            <Video
              source={{
                uri: request.mediaUrl,
                bufferConfig: {
                  minBufferMs: 15000,
                  maxBufferMs: 50000,
                  bufferForPlaybackMs: 2500,
                  bufferForPlaybackAfterRebufferMs: 5000,
                },
              }}
              style={styles.video}
              controls
              resizeMode="contain"
              repeat
              paused={false}
            />
          ) : (
            <Image source={{uri: request.mediaUrl}} style={styles.image} />
          )}
        </>
      )}
      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
      />
      <TextInput
        placeholder="Deadline"
        value={deadline}
        onChangeText={setDeadline}
        style={styles.input}
      />
      <TextInput
        placeholder="Comment"
        value={comment}
        onChangeText={setComment}
        style={styles.input}
      />
      <Button title="Submit Proposal" onPress={submitProposal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default RequestDetailScreen;
