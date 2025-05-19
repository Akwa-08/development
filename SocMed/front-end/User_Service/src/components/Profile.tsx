// src/components/Profile.tsx - Update with profile picture upload
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE } from '../graphql/mutations';
import ProfilePictureUpload from './ProfilePictureUpload'; // Add import

// Interface for user profile data
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  username?: string;
  bio?: string;
  date_of_birth?: string;
  profile_picture_url?: string;
  banner_picture_url?: string;
  address?: string;
  phone?: string;
}

// Interface for edit profile form
interface EditProfileForm {
  username: string;
  firstName: string;
  lastName: string;
  middleName: string;
  bio: string;
  dateOfBirth: string;
  address: string;
  phone: string;
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditProfileForm>({
    username: '',
    firstName: '',
    lastName: '',
    middleName: '',
    bio: '',
    dateOfBirth: '',
    address: '',
    phone: '',
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Apollo mutation hook
  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      // Update local profile data with the response
      if (profile) {
        setProfile({
          ...profile,
          username: data.updateProfile.username || profile.username,
          first_name: data.updateProfile.firstName,
          last_name: data.updateProfile.lastName,
          middle_name: data.updateProfile.middleName || profile.middle_name,
          bio: data.updateProfile.bio || profile.bio,
          date_of_birth: data.updateProfile.dateOfBirth || profile.date_of_birth,
          address: data.updateProfile.address || profile.address,
          phone: data.updateProfile.phone || profile.phone,
        });
      }
      setIsEditDialogOpen(false);
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: `Error updating profile: ${error.message}`,
        severity: 'error',
      });
    },
  });

  // Fetch user profile data
  const fetchProfile = useCallback(async () => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) throw error;
    setProfile(data);
    
    // Initialize edit form with current values
    setEditForm({
      username: data.username || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      middleName: data.middle_name || '',
      bio: data.bio || '',
      dateOfBirth: data.date_of_birth || '',
      address: data.address || '',
      phone: data.phone || '',
    });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [navigate]); // Only depend on navigate

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmitEdit = () => {
    // Update profile using GraphQL mutation
    updateProfile({
      variables: {
        username: editForm.username || undefined,
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
        middleName: editForm.middleName || undefined,
        bio: editForm.bio || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        address: editForm.address || undefined,
        phone: editForm.phone || undefined,
      },
    });
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Handle profile picture update success
  const handleProfilePictureUpdate = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        profile_picture_url: url
      });
    }
    
    setNotification({
      open: true,
      message: 'Profile picture updated successfully',
      severity: 'success',
    });

    localStorage.setItem('profile_picture_updated', Date.now().toString());
  };

  // Generate a banner color based on user ID for consistency
  const generateColorFromId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase()
      .padStart(6, '0');
    return `#${c}`;
  };

  // Default banner with gradient based on user ID
  const getBannerStyle = (id: string) => {
    const baseColor = generateColorFromId(id);
    return {
      background: `linear-gradient(135deg, ${baseColor} 0%, #37474F 100%)`,
      height: '200px',
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, mt: 8 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pt: 8 }}>
      <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
        {profile ? (
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Banner Image */}
            <Box sx={{ position: 'relative', ...getBannerStyle(profile.id) }}>
              {profile.banner_picture_url && (
                <Box
                  component="img"
                  src={profile.banner_picture_url}
                  alt="Profile Banner"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              
              {/* Profile Avatar - positioned to overlap the banner */}
              <Box sx={{ position: 'absolute', bottom: -60, left: 24 }}>
                <ProfilePictureUpload 
                  userId={profile.id}
                  currentProfilePicture={profile.profile_picture_url}
                  size={120}
                  onUploadSuccess={handleProfilePictureUpdate}
                />
              </Box>
              
              {/* Edit Profile Button */}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  borderRadius: 5,
                }}
              >
                Edit Profile
              </Button>
            </Box>
            
            {/* Profile Info Section */}
            <Box sx={{ pt: 8, px: 3, pb: 3 }}>
              <Typography variant="h4" fontWeight="bold">
                {profile.first_name} {profile.last_name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                @{profile.username || profile.first_name.toLowerCase() + profile.last_name.toLowerCase()}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {profile.bio || 'No bio available'}
              </Typography>
              
              {/* Personal Information Section */}
              <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Personal Information
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.first_name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Birthday
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.date_of_birth || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Middle Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.middle_name || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.last_name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.phone || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profile.address || 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                    sx={{ borderRadius: 5 }}
                  >
                    Logout
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>No profile found. Please log in.</Typography>
          </Box>
        )}
      </Container>
      
      {/* Edit Profile Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => !updateLoading && setIsEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Username"
                  name="username"
                  value={editForm.username}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="First Name"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Last Name"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Middle Name"
                  name="middleName"
                  value={editForm.middleName}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Bio"
                  name="bio"
                  multiline
                  rows={3}
                  value={editForm.bio}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Date of Birth"
                  name="dateOfBirth"
                  placeholder="YYYY-MM-DD"
                  value={editForm.dateOfBirth}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Address"
                  name="address"
                  value={editForm.address}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)} disabled={updateLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained" 
            disabled={updateLoading}
          >
            {updateLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;