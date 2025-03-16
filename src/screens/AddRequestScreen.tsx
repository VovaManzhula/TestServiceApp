import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  putFile,
  ref,
} from '@react-native-firebase/storage';
import {Picker} from '@react-native-picker/picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Alert, Button, Image, StyleSheet, TextInput, View} from 'react-native';
import RNFS from 'react-native-fs';
import {launchImageLibrary} from 'react-native-image-picker';
import {requestPermissions} from '../helpers/permissions';
import {RootStackParamList} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRequest'>;

const AddRequestScreen: React.FC<Props> = ({navigation}) => {
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [media, setMedia] = useState<{uri: string; type: string} | null>(null);

  const selectMedia = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.2,
        selectionLimit: 1,
        videoQuality: 'low',
      },
      response => {
        if (
          !response.didCancel &&
          !response.errorCode &&
          response.assets &&
          response.assets[0]?.uri
        ) {
          setMedia({
            uri: response.assets[0].uri,
            type: response.assets[0].type ?? '',
          });
        } else {
          Alert.alert(
            'Error',
            'Failed to select media. Please try again or check permissions.',
          );
        }
      },
    );
  };

  const uploadMedia = async (): Promise<{url: string; type: string} | null> => {
    if (!media) {
      console.error('No media URI provided.');
      return null;
    }

    try {
      const filePath = media.uri.replace('file://', '');
      const permanentPath = `${RNFS.CachesDirectoryPath}/${Date.now()}`;
      await RNFS.copyFile(filePath, permanentPath);

      const storageRef = ref(getStorage(), `requests/${Date.now()}`);
      await putFile(storageRef, `file://${permanentPath}`);

      const downloadUrl = await getDownloadURL(storageRef);
      return {url: downloadUrl, type: media.type};
    } catch (error) {
      const errorMessage = (error as Error).message;
      Alert.alert(
        'Upload Error',
        `Failed to upload media: ${errorMessage}. Please try again or check storage permissions.`,
      );
      return null;
    }
  };

  const publishRequest = async () => {
    if (!description.trim() || !category) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const mediaData = await uploadMedia();
      if (!mediaData) {
        return;
      }

      const db = getFirestore();
      const newRequestRef = await addDoc(collection(db, 'requests'), {
        description,
        category,
        mediaUrl: mediaData.url,
        mediaType: mediaData.type,
        createdAt: serverTimestamp(),
        userId: '1',
        status: 'pending',
      });

      const requestId = newRequestRef.id;
      const userRef = doc(db, 'users', '1');
      const userSnap = await getDoc(userRef);

      if (userSnap.exists) {
        const currentRequestsIds = userSnap.data()?.requestsIds || [];
        await updateDoc(userRef, {
          requestsIds: [...currentRequestsIds, requestId],
        });
      } else {
        await setDoc(userRef, {
          requestsIds: [requestId],
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Publish error:', error);
      Alert.alert('Error', 'Failed to publish request. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Select Photo/Video" onPress={selectMedia} />
      {media?.uri && <Image source={{uri: media.uri}} style={styles.image} />}
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <Picker
        selectedValue={category}
        onValueChange={setCategory}
        style={styles.picker}>
        <Picker.Item label="Select category" value="" />
        <Picker.Item label="Repair" value="repair" />
        <Picker.Item label="Cleaning" value="cleaning" />
        <Picker.Item label="Transport" value="transport" />
      </Picker>
      <Button title="Publish Request" onPress={publishRequest} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
    marginVertical: 10,
    backgroundColor: '#fff',
  },
});

export default AddRequestScreen;
