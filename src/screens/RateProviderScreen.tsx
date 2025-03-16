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
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Alert, Button, StyleSheet, TextInput, View} from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import {RootStackParamList} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RateProvider'>;

const RateProviderScreen: React.FC<Props> = ({route, navigation}) => {
  const {requestId, providerId} = route.params;
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  const saveRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating.');
      return;
    }

    try {
      const db = getFirestore();
      const newRatingRef = await addDoc(collection(db, 'ratings'), {
        requestId,
        providerId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      const ratingId = newRatingRef.id;
      const userRef = doc(db, 'users', providerId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists) {
        const userData = userSnap.data();
        const currentTasks = userData?.completedTasks || 0;
        const currentRatings = userData?.ratings || [];
        const currentRatesIds = userData?.ratesIds || [];

        currentRatings.push(rating);
        const newAverageRating =
          currentRatings.reduce((a: number, b: number) => a + b, 0) /
          currentRatings.length;

        await updateDoc(userRef, {
          completedTasks: currentTasks + 1,
          averageRating: newAverageRating,
          ratings: currentRatings,
          ratesIds: [...currentRatesIds, ratingId],
        });
      } else {
        await setDoc(userRef, {
          completedTasks: 1,
          averageRating: rating,
          ratings: [rating],
          ratesIds: [ratingId],
        });
      }

      await updateDoc(doc(db, 'requests', requestId), {status: 'completed'});
      navigation.goBack();
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StarRating rating={rating} onChange={setRating} maxStars={5} />
      <TextInput
        placeholder="Comment"
        value={comment}
        onChangeText={setComment}
        style={styles.input}
      />
      <Button title="Completed!" onPress={saveRating} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default RateProviderScreen;
