import {Alert, Platform} from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  PermissionStatus,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';

type AppPermissions =
  | typeof PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
  | typeof PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
  | typeof PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
  | typeof PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
  | typeof PERMISSIONS.ANDROID.CAMERA
  | typeof PERMISSIONS.IOS.PHOTO_LIBRARY
  | typeof PERMISSIONS.IOS.CAMERA;

export const requestPermissions = async (): Promise<boolean> => {
  const permissionsToCheck = [
    Platform.select({
      android:
        Platform.OS === 'android' &&
        parseInt(Platform.Version as unknown as string, 10) >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    }),
    Platform.select({
      android:
        Platform.OS === 'android' &&
        parseInt(Platform.Version as unknown as string, 10) >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ios: undefined,
    }),
    Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    }),
  ].filter((perm): perm is AppPermissions => perm !== undefined);

  let allPermissionsGranted = false;

  while (!allPermissionsGranted) {
    const checkPermissions: PermissionStatus[] = await Promise.all(
      permissionsToCheck.map(permission => check(permission)),
    );

    const deniedPermissions = permissionsToCheck.filter(
      (_, index) => checkPermissions[index] !== RESULTS.GRANTED,
    );

    if (deniedPermissions.length === 0) {
      allPermissionsGranted = true;
      break;
    }

    const permissionNames = deniedPermissions.map(perm => {
      if (
        perm === PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE ||
        perm === PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      ) {
        return 'Storage (Read)';
      }
      if (
        perm === PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE ||
        perm === PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
      ) {
        return 'Storage (Write)';
      }
      if (perm === PERMISSIONS.ANDROID.CAMERA) {
        return 'Camera';
      }
      if (perm === PERMISSIONS.IOS.PHOTO_LIBRARY) {
        return 'Photo Library';
      }
      if (perm === PERMISSIONS.IOS.CAMERA) {
        return 'Camera';
      }
      return 'Unknown Permission';
    });

    const blockedPermissions = deniedPermissions.filter(
      (_, index) => checkPermissions[index] === RESULTS.BLOCKED,
    );

    if (blockedPermissions.length > 0) {
      Alert.alert(
        'Permissions Blocked',
        `The following permissions are blocked and need to be enabled in settings: ${permissionNames.join(
          ', ',
        )}. Press OK to open settings.`,
        [
          {text: 'Cancel', style: 'cancel', onPress: () => {}},
          {
            text: 'OK',
            onPress: async () => {
              await openSettings();
            },
          },
        ],
      );
      return false;
    }

    const results = await requestMultiple(deniedPermissions);
    const stillDenied = Object.values(results).some(
      result => result === RESULTS.DENIED || result === RESULTS.BLOCKED,
    );

    if (stillDenied) {
      const continueRequest = await new Promise<boolean>(resolve => {
        Alert.alert(
          'Permission Required',
          `Please grant the following permissions to select media: ${permissionNames.join(
            ', ',
          )}.`,
          [
            {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
            {text: 'Try Again', onPress: () => resolve(true)},
          ],
        );
      });

      if (!continueRequest) {
        return false;
      }
    } else {
      allPermissionsGranted = true;
    }
  }

  return true;
};
