import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

// Async thunks for API calls
export const fetchDiscoverByInterest = createAsyncThunk(
  'mainLanding/fetchDiscoverByInterest',
  async (nextPageToken = null) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const url = nextPageToken 
      ? `${base_url}/schedule/places/getNearest?type=interest&page=${nextPageToken}`
      : `${base_url}/schedule/places/getNearest?type=interest`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return { data, nextPageToken };
  }
);

export const fetchMountains = createAsyncThunk(
  'mainLanding/fetchMountains',
  async (nextPageToken = null) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const url = nextPageToken 
      ? `${base_url}/schedule/places/getNearest?type=mountains&keyword=Mountains&page=${nextPageToken}`
      : `${base_url}/schedule/places/getNearest?type=mountains&keyword=Mountains`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return { data, nextPageToken };
  }
);

export const fetchViewPoints = createAsyncThunk(
  'mainLanding/fetchViewPoints',
  async (nextPageToken = null) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const url = nextPageToken 
      ? `${base_url}/schedule/places/getNearest?type=view points&keyword=View Points&page=${nextPageToken}`
      : `${base_url}/schedule/places/getNearest?type=view points&keyword=View Points`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return { data, nextPageToken };
  }
);

export const fetchAdventurePlaces = createAsyncThunk(
  'mainLanding/fetchAdventurePlaces',
  async ({ tag, nextPageToken = null }) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const url = nextPageToken 
      ? `${base_url}/schedule/places/getNearest?type=${tag}&keyword=${tag}&page=${nextPageToken}`
      : `${base_url}/schedule/places/getNearest?type=${tag}&keyword=${tag}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return { data, tag, nextPageToken };
  }
);

export const fetchAllSchedule = createAsyncThunk(
  'mainLanding/fetchAllSchedule',
  async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${base_url}/schedule/listing/filter?filter=Public`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return data;
  }
);

export const fetchAllPosts = createAsyncThunk(
  'mainLanding/fetchAllPosts',
  async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    // Try without filter first
    let response = await fetch(`${base_url}/post/listing`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    let data = await response.json();
    
    if (!Array.isArray(data?.data) || data.data.length === 0) {
      // Try with FollowersOnly filter
      response = await fetch(`${base_url}/post/listing/filter?filter=FollowersOnly`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      data = await response.json();
      
      if (!Array.isArray(data?.data) || data.data.length === 0) {
        // Try with Public filter
        response = await fetch(`${base_url}/post/listing/filter?filter=Public`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        data = await response.json();
      }
    }
    
    return data;
  }
);

export const fetchShorts = createAsyncThunk(
  'mainLanding/fetchShorts',
  async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${base_url}/shorts/listing`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    return data;
  }
);

export const fetchDiscoverByNearest = createAsyncThunk(
  'mainLanding/fetchDiscoverByNearest',
  async (nextPageToken = null) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const url = nextPageToken 
      ? `${base_url}/schedule/places/getNearest?type=nearest&page=${nextPageToken}`
      : `${base_url}/schedule/places/getNearest?type=nearest`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return { data, nextPageToken };
  }
);

export const fetchUnreadNotifications = createAsyncThunk(
  'mainLanding/fetchUnreadNotifications',
  async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${base_url}/user/getNotifications?read=false&offset=0&limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return Array.isArray(data.data) ? data.data.length : 0;
  }
);

export const updateLiveLocation = createAsyncThunk(
  'mainLanding/updateLiveLocation',
  async (location) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${base_url}/user/update-live-location`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(location)
    });
    return response.json();
  }
);

const initialState = {
  // UI States
  selectedButton: 'All',
  selectedAdventureTag: 'Beach',
  isChatVisible: false,
  
  // Loading States
  isDiscoverByInterestLoading: false,
  isMountainsLoading: false,
  isViewPointsLoading: false,
  isAdventureLoading: false,
  isScheduleLoading: false,
  isPostsLoading: false,
  isShortsLoading: false,
  isNearestLoading: false,
  isStoriesLoading: false,
  
  // Data States
  discoverByInterest: [],
  mountains: [],
  viewPoints: [],
  adventurePlaces: [],
  allSchedule: [],
  allPosts: [],
  allShorts: [],
  discoverByNearest: [],
  
  // Pagination States
  discoverByInterestPagination: { nextPageToken: null, hasMore: true },
  mountainsPagination: { nextPageToken: null, hasMore: true },
  viewPointsPagination: { nextPageToken: null, hasMore: true },
  adventurePagination: { nextPageToken: null, hasMore: true },
  shortsPagination: { total: 0, limit: 10, offset: 0, totalPages: 0 },
  discoverByNearestPagination: { nextPageToken: null, hasMore: true },
  
  // Other States
  unreadNotifications: 0,
  userLocation: { latitude: 13.0843, longitude: 80.2705 },
  
  // Error States
  errors: {}
};

const mainLandingSlice = createSlice({
  name: 'mainLanding',
  initialState,
  reducers: {
    setSelectedButton: (state, action) => {
      state.selectedButton = action.payload;
    },
    setSelectedAdventureTag: (state, action) => {
      state.selectedAdventureTag = action.payload;
    },
    setIsChatVisible: (state, action) => {
      state.isChatVisible = action.payload;
    },
    clearAdventurePlaces: (state) => {
      state.adventurePlaces = [];
      state.adventurePagination = { nextPageToken: null, hasMore: false };
    },
    clearErrors: (state) => {
      state.errors = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Discover By Interest
      .addCase(fetchDiscoverByInterest.pending, (state) => {
        state.isDiscoverByInterestLoading = true;
      })
      .addCase(fetchDiscoverByInterest.fulfilled, (state, action) => {
        state.isDiscoverByInterestLoading = false;
        const { data, nextPageToken } = action.payload;
        if (Array.isArray(data?.data)) {
          const formattedData = data.data.map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name
          }));
          
          if (nextPageToken) {
            // Load more - add to existing data
            state.discoverByInterest = [...formattedData, ...state.discoverByInterest];
          } else {
            // Initial load - replace data
            state.discoverByInterest = formattedData;
          }
          
          state.discoverByInterestPagination = {
            nextPageToken: data.nextPageToken || null,
            hasMore: !!data.nextPageToken
          };
        }
      })
      .addCase(fetchDiscoverByInterest.rejected, (state, action) => {
        state.isDiscoverByInterestLoading = false;
        state.errors.discoverByInterest = action.error.message;
      })
      
      // Mountains
      .addCase(fetchMountains.pending, (state) => {
        state.isMountainsLoading = true;
      })
      .addCase(fetchMountains.fulfilled, (state, action) => {
        state.isMountainsLoading = false;
        const { data, nextPageToken } = action.payload;
        if (Array.isArray(data?.data)) {
          const formattedData = data.data.map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name,
            address: item.address,
            rating: parseFloat(item.rating) || 0,
            distanceInKilometer: item.distanceInKilometer,
            location: item.location
          }));
          
          if (nextPageToken) {
            state.mountains = [...formattedData, ...state.mountains];
          } else {
            state.mountains = formattedData;
          }
          
          state.mountainsPagination = {
            nextPageToken: data.nextPageToken || null,
            hasMore: !!data.nextPageToken
          };
        }
      })
      .addCase(fetchMountains.rejected, (state, action) => {
        state.isMountainsLoading = false;
        state.errors.mountains = action.error.message;
      })
      
      // View Points
      .addCase(fetchViewPoints.pending, (state) => {
        state.isViewPointsLoading = true;
      })
      .addCase(fetchViewPoints.fulfilled, (state, action) => {
        state.isViewPointsLoading = false;
        const { data, nextPageToken } = action.payload;
        if (Array.isArray(data?.data)) {
          const formattedData = data.data.map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name,
            address: item.address,
            rating: parseFloat(item.rating) || 0,
            distanceInKilometer: item.distanceInKilometer,
            location: item.location
          }));
          
          if (nextPageToken) {
            state.viewPoints = [...formattedData, ...state.viewPoints];
          } else {
            state.viewPoints = formattedData;
          }
          
          state.viewPointsPagination = {
            nextPageToken: data.nextPageToken || null,
            hasMore: !!data.nextPageToken
          };
        }
      })
      .addCase(fetchViewPoints.rejected, (state, action) => {
        state.isViewPointsLoading = false;
        state.errors.viewPoints = action.error.message;
      })
      
      // Adventure Places
      .addCase(fetchAdventurePlaces.pending, (state) => {
        state.isAdventureLoading = true;
      })
      .addCase(fetchAdventurePlaces.fulfilled, (state, action) => {
        state.isAdventureLoading = false;
        const { data, tag, nextPageToken } = action.payload;
        if (Array.isArray(data?.data)) {
          const formattedData = data.data.map(item => ({
            id: item._id,
            image: item.image,
            name: item.name,
            address: item.address,
            rating: parseFloat(item.rating) || 0,
            distanceInKilometer: item.distanceInKilometer,
            location: item.location
          }));
          
          if (nextPageToken) {
            state.adventurePlaces = [...formattedData, ...state.adventurePlaces];
          } else {
            state.adventurePlaces = formattedData;
          }
          
          state.adventurePagination = {
            nextPageToken: data.nextPageToken || null,
            hasMore: !!data.nextPageToken
          };
        }
      })
      .addCase(fetchAdventurePlaces.rejected, (state, action) => {
        state.isAdventureLoading = false;
        state.errors.adventurePlaces = action.error.message;
      })
      
      // All Schedule
      .addCase(fetchAllSchedule.pending, (state) => {
        state.isScheduleLoading = true;
      })
      .addCase(fetchAllSchedule.fulfilled, (state, action) => {
        state.isScheduleLoading = false;
        if (Array.isArray(action.payload?.data)) {
          state.allSchedule = action.payload.data.map(item => ({
            id: item._id,
            _id: item._id,
            title: item.tripName,
            from: (item.locationDetails?.[0]?.address 
              ? item.locationDetails[0].address.slice(0, 5) + '...'
              : 'Unknown'),
            to: (item.locationDetails?.[1]?.address 
            ? item.locationDetails[1].address.slice(0, 5) + '...'
            : 'Unknown'),
            date: new Date(item.Dates.from).toLocaleDateString(),
            endDate: new Date(item.Dates.end).toLocaleDateString(),
            travelMode: item.travelMode,
            visible: item.visible,
            numberOfDays: item.numberOfDays.toString(),
            imageUrl: item.bannerImage,
            locationDetails: item.locationDetails,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            createdBy: item.createdBy,
            riders: '0 riders',
            joined: false,
            rawLocation: {
              from: {
                latitude: item.location?.from?.latitude || 0,
                longitude: item.location?.from?.longitude || 0
              },
              to: {
                latitude: item.location?.to?.latitude || 0,
                longitude: item.location?.to?.longitude || 0
              }
            }
          }));
        }
      })
      .addCase(fetchAllSchedule.rejected, (state, action) => {
        state.isScheduleLoading = false;
        state.errors.allSchedule = action.error.message;
      })
      
      // All Posts
      .addCase(fetchAllPosts.pending, (state) => {
        state.isPostsLoading = true;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.isPostsLoading = false;
        if (Array.isArray(action.payload?.data)) {
          state.allPosts = action.payload.data.map(item => {
            let mediaUrls = item.mediaUrl;
            
            if (typeof mediaUrls === 'string') {
              try {
                if (mediaUrls.startsWith('[')) {
                  mediaUrls = JSON.parse(mediaUrls);
                } else {
                  mediaUrls = [mediaUrls];
                }
              } catch (e) {
                mediaUrls = [mediaUrls];
              }
            }

            if (!Array.isArray(mediaUrls)) {
              mediaUrls = [mediaUrls];
            }

            mediaUrls = mediaUrls.filter(url => url != null);
            mediaUrls = mediaUrls.map(url => {
              if (typeof url === 'string') {
                return url.replace(/\\/g, '').replace(/"/g, '');
              }
              return url;
            });

            return {
              _id: item._id,
              title: item.postTitle,
              description: item.description || '',
              postTitle: item.postTitle,
              postType: item.postType,
              mediaType: item.mediaType,
              mediaUrl: mediaUrls,
              imageUrl: mediaUrls,
              createdBy: item.createdBy,
              tags: Array.isArray(item.tags) ? item.tags : [],
              likesCount: item.likesCount || 0,
              commentsCount: item.commentsCount || 0,
              shareCount: item.shareCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            };
          });
        }
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.isPostsLoading = false;
        state.errors.allPosts = action.error.message;
      })
      
      // Shorts
      .addCase(fetchShorts.pending, (state) => {
        state.isShortsLoading = true;
      })
      .addCase(fetchShorts.fulfilled, (state, action) => {
        state.isShortsLoading = false;
        if (action.payload.status && Array.isArray(action.payload.data)) {
          const shortsList = action.payload.data.map(short => ({
            id: short._id,
            type: 'short',
            title: short.title,
            description: short.description,
            videoUrl: short.videoUrl,
            thumbnailUrl: short.thumbnailUrl,
            createdBy: short.createdBy,
            viewsCount: short.viewsCount || 0,
            likesCount: short.likesCount || 0,
            commentsCount: short.commentsCount || 0,
            createdAt: short.createdAt,
            updatedAt: short.updatedAt
          }));
          
          const mp4ShortsList = shortsList.filter(
            item => typeof item.videoUrl === 'string' && item.videoUrl.toLowerCase().endsWith('.mp4')
          );
          state.allShorts = mp4ShortsList;
          state.shortsPagination = action.payload.pagination || {};
        }
      })
      .addCase(fetchShorts.rejected, (state, action) => {
        state.isShortsLoading = false;
        state.errors.shorts = action.error.message;
      })
      
      // Discover By Nearest
      .addCase(fetchDiscoverByNearest.pending, (state) => {
        state.isNearestLoading = true;
      })
      .addCase(fetchDiscoverByNearest.fulfilled, (state, action) => {
        state.isNearestLoading = false;
        const { data, nextPageToken } = action.payload;
        if (Array.isArray(data?.data)) {
          const formattedData = data.data.slice(0, 100).map(item => ({
            id: item._id || item.image,
            image: item.image,
            title: item.name,
            subtitle: item.address || 'No address',
            rating: parseFloat(item.rating) || 0,
            distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null,
            location: {
              latitude: item.location?.lat || 0,
              longitude: item.location?.lng || 0
            }
          }));
          
          if (nextPageToken) {
            state.discoverByNearest = [...formattedData, ...state.discoverByNearest];
          } else {
            state.discoverByNearest = formattedData;
          }
          
          state.discoverByNearestPagination = {
            nextPageToken: data.nextPageToken || null,
            hasMore: !!data.nextPageToken
          };
        }
      })
      .addCase(fetchDiscoverByNearest.rejected, (state, action) => {
        state.isNearestLoading = false;
        state.errors.discoverByNearest = action.error.message;
      })
      
      // Unread Notifications
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.unreadNotifications = action.payload;
      })
      
      // Update Live Location
      .addCase(updateLiveLocation.fulfilled, (state, action) => {
        // Location updated successfully
      });
  }
});

export const {
  setSelectedButton,
  setSelectedAdventureTag,
  setIsChatVisible,
  clearAdventurePlaces,
  clearErrors
} = mainLandingSlice.actions;

export default mainLandingSlice.reducer; 