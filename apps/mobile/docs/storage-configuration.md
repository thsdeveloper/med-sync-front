# Storage Configuration - Profile Images

## Overview

This document describes the configuration and usage of the `profile-images` storage bucket in Supabase for the MedSync application.

## Bucket Configuration

### Basic Details

- **Bucket Name**: `profile-images`
- **Bucket ID**: `profile-images`
- **Public Read Access**: ✅ Enabled (anyone can view profile images)
- **File Size Limit**: 5 MB (5,242,880 bytes)
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/gif`

### Folder Structure Pattern

Profile images are organized using a user-based folder structure:

```
profile-images/
├── {user_id_1}/
│   ├── avatar.jpg
│   ├── avatar.png
│   └── profile-{timestamp}.jpg
├── {user_id_2}/
│   ├── avatar.jpg
│   └── cover.jpg
└── {user_id_3}/
    └── avatar.png
```

#### Recommended Naming Conventions

1. **Single Profile Picture (Simple)**
   ```
   {user_id}/avatar.jpg
   ```
   Example: `550e8400-e29b-41d4-a716-446655440000/avatar.jpg`

2. **Versioned Profile Pictures** (for keeping history)
   ```
   {user_id}/profile-{timestamp}.jpg
   ```
   Example: `550e8400-e29b-41d4-a716-446655440000/profile-1702350000000.jpg`

3. **Multiple Image Types**
   ```
   {user_id}/avatar.jpg      # Main profile picture
   {user_id}/cover.jpg       # Cover/banner image
   {user_id}/thumbnail.jpg   # Small thumbnail
   ```

**Important**: The first folder level MUST be the user's UUID from `auth.users.id`. This is enforced by RLS policies.

## Row Level Security (RLS) Policies

The `profile-images` bucket has the following RLS policies configured on the `storage.objects` table:

### 1. Public Read Access
**Policy Name**: `Public read access for profile images`

- **Operation**: `SELECT`
- **Who**: Everyone (authenticated and anonymous users)
- **What**: Can view/download all images in the profile-images bucket
- **Why**: Profile pictures are meant to be publicly visible

```sql
-- Anyone can view profile images
SELECT * FROM storage.objects WHERE bucket_id = 'profile-images';
```

### 2. Authenticated Upload (INSERT)
**Policy Name**: `Authenticated users can upload to own profile folder`

- **Operation**: `INSERT`
- **Who**: Authenticated users only
- **What**: Can upload images ONLY to their own folder (`{their_user_id}/*`)
- **Constraint**: Folder name must match user's UUID

```sql
-- Users can only upload to folders matching their user_id
-- Path: {user_id}/avatar.jpg ✅
-- Path: {different_user_id}/avatar.jpg ❌
```

### 3. Update Own Images (UPDATE)
**Policy Name**: `Users can update own profile images`

- **Operation**: `UPDATE`
- **Who**: Authenticated users only
- **What**: Can replace/update images in their own folder only

### 4. Delete Own Images (DELETE)
**Policy Name**: `Users can delete own profile images`

- **Operation**: `DELETE`
- **Who**: Authenticated users only
- **What**: Can delete images from their own folder only

## Code Examples

### TypeScript/React Native (Supabase Client)

#### 1. Upload Profile Image

```typescript
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

async function uploadProfileImage(userId: string) {
  try {
    // Pick image from device
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const imageUri = result.assets[0].uri;

    // Convert to blob (for web) or use file path (for native)
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Determine file extension
    const fileExt = imageUri.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      });

    if (error) throw error;

    console.log('Upload successful:', data);
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
```

#### 2. Get Public URL for Profile Image

```typescript
import { supabase } from '@/lib/supabase';

function getProfileImageUrl(userId: string, fileName: string = 'avatar.jpg'): string {
  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(`${userId}/${fileName}`);

  return data.publicUrl;
}

// Usage
const avatarUrl = getProfileImageUrl('550e8400-e29b-41d4-a716-446655440000');
// Returns: https://your-project.supabase.co/storage/v1/object/public/profile-images/550e8400-e29b-41d4-a716-446655440000/avatar.jpg
```

#### 3. Download Profile Image

```typescript
import { supabase } from '@/lib/supabase';

async function downloadProfileImage(userId: string, fileName: string = 'avatar.jpg') {
  try {
    const { data, error } = await supabase.storage
      .from('profile-images')
      .download(`${userId}/${fileName}`);

    if (error) throw error;

    // Convert blob to URL for display
    const url = URL.createObjectURL(data);
    return url;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
```

#### 4. Delete Profile Image

```typescript
import { supabase } from '@/lib/supabase';

async function deleteProfileImage(userId: string, fileName: string = 'avatar.jpg') {
  try {
    const { data, error } = await supabase.storage
      .from('profile-images')
      .remove([`${userId}/${fileName}`]);

    if (error) throw error;

    console.log('Delete successful:', data);
    return data;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
```

#### 5. Update User Profile with Image URL

```typescript
import { supabase } from '@/lib/supabase';

async function updateUserProfileImage(userId: string) {
  try {
    // 1. Upload new image
    await uploadProfileImage(userId);

    // 2. Get public URL
    const avatarUrl = getProfileImageUrl(userId);

    // 3. Update medical_staff table with new avatar URL
    const { error } = await supabase
      .from('medical_staff')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    return avatarUrl;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
}
```

## Complete React Native Component Example

```tsx
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export function ProfileImageUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const pickAndUploadImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !user) return;

      setUploading(true);

      // Convert to blob
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      // Upload to storage
      const fileExt = result.assets[0].uri.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);

      // Update database (optional - if you store URL in medical_staff table)
      const { error: updateError } = await supabase
        .from('medical_staff')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Profile image updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        ) : (
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#ccc' }} />
        )}
        {uploading && <ActivityIndicator style={{ position: 'absolute' }} />}
      </TouchableOpacity>
    </View>
  );
}
```

## Database Schema Extension (Optional)

If you want to store the profile image URL in the database, you can add a column to the `medical_staff` table:

```sql
-- Add avatar_url column to medical_staff table
ALTER TABLE public.medical_staff
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment
COMMENT ON COLUMN public.medical_staff.avatar_url IS 'Public URL to user profile image in storage.profile-images bucket';
```

## Testing the Configuration

### Manual Testing Steps

1. **Test Public Read Access** (no authentication required):
   ```typescript
   const url = supabase.storage
     .from('profile-images')
     .getPublicUrl('test-user-id/avatar.jpg');
   // Should return a public URL without error
   ```

2. **Test Upload as Authenticated User**:
   ```typescript
   // Login first
   await supabase.auth.signIn({ email: 'test@example.com', password: 'password' });

   // Try uploading to own folder (should succeed)
   const { data, error } = await supabase.storage
     .from('profile-images')
     .upload(`${userId}/avatar.jpg`, file);
   // Should succeed
   ```

3. **Test Upload Restriction**:
   ```typescript
   // Try uploading to someone else's folder (should fail)
   const { data, error } = await supabase.storage
     .from('profile-images')
     .upload('different-user-id/avatar.jpg', file);
   // Should fail with permission error
   ```

4. **Test Delete**:
   ```typescript
   // Delete own image (should succeed)
   await supabase.storage
     .from('profile-images')
     .remove([`${userId}/avatar.jpg`]);
   ```

## Security Considerations

1. **File Size Limit**: 5 MB maximum to prevent abuse
2. **MIME Type Restriction**: Only image types allowed
3. **User Isolation**: Users can only upload/modify/delete their own images
4. **Public Read**: Profile images are intentionally public
5. **No Anonymous Uploads**: Must be authenticated to upload

## Migration and Deployment

The storage bucket and policies are created via SQL migration:

**Migration File**: `supabase/migrations/20251212000000_create_profile_images_bucket.sql`

To apply the migration:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply via Supabase Dashboard
# Go to SQL Editor > New Query > Paste migration content > Run
```

## Troubleshooting

### Common Issues

1. **Upload fails with "permission denied"**
   - Ensure user is authenticated
   - Check that folder name matches user's UUID
   - Verify RLS policies are enabled

2. **Image URL not loading**
   - Check bucket is set to `public: true`
   - Verify file was uploaded successfully
   - Check CORS settings if accessing from web

3. **File too large error**
   - Ensure image is under 5 MB
   - Consider compressing image before upload

4. **Invalid MIME type**
   - Check file extension is one of: jpg, jpeg, png, webp, gif
   - Verify contentType is set correctly during upload

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
