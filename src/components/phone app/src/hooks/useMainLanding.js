import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDiscoverByInterest,
  fetchMountains,
  fetchViewPoints,
  fetchAdventurePlaces,
  fetchAllSchedule,
  fetchAllPosts,
  fetchShorts,
  fetchDiscoverByNearest,
  fetchUnreadNotifications,
  updateLiveLocation,
  setSelectedButton,
  setSelectedAdventureTag,
  setIsChatVisible,
  clearAdventurePlaces
} from '../redux/slices/mainLandingSlice';

export const useMainLanding = () => {
  const dispatch = useDispatch();
  const {
    // UI States
    selectedButton,
    selectedAdventureTag,
    isChatVisible,
    
    // Loading States
    isDiscoverByInterestLoading,
    isMountainsLoading,
    isViewPointsLoading,
    isAdventureLoading,
    isScheduleLoading,
    isPostsLoading,
    isShortsLoading,
    isNearestLoading,
    
    // Data States
    discoverByInterest,
    mountains,
    viewPoints,
    adventurePlaces,
    allSchedule,
    allPosts,
    allShorts,
    discoverByNearest,
    
    // Pagination States
    discoverByInterestPagination,
    mountainsPagination,
    viewPointsPagination,
    adventurePagination,
    shortsPagination,
    discoverByNearestPagination,
    
    // Other States
    unreadNotifications,
    userLocation,
    errors
  } = useSelector(state => state.mainLanding);

  // Initialize all data on mount
  const initializeData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      await Promise.all([
        dispatch(fetchDiscoverByInterest()),
        dispatch(fetchMountains()),
        dispatch(fetchViewPoints()),
        dispatch(fetchAllSchedule()),
        dispatch(fetchAllPosts()),
        dispatch(fetchShorts()),
        dispatch(fetchDiscoverByNearest()),
        dispatch(fetchUnreadNotifications())
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, [dispatch]);

  // Load more functions
  const loadMoreDiscoverByInterest = useCallback(() => {
    if (discoverByInterestPagination.hasMore && !isDiscoverByInterestLoading) {
      dispatch(fetchDiscoverByInterest(discoverByInterestPagination.nextPageToken));
    }
  }, [dispatch, discoverByInterestPagination, isDiscoverByInterestLoading]);

  const loadMoreMountains = useCallback(() => {
    if (mountainsPagination.hasMore && !isMountainsLoading) {
      dispatch(fetchMountains(mountainsPagination.nextPageToken));
    }
  }, [dispatch, mountainsPagination, isMountainsLoading]);

  const loadMoreViewPoints = useCallback(() => {
    if (viewPointsPagination.hasMore && !isViewPointsLoading) {
      dispatch(fetchViewPoints(viewPointsPagination.nextPageToken));
    }
  }, [dispatch, viewPointsPagination, isViewPointsLoading]);

  const loadMoreAdventurePlaces = useCallback(() => {
    if (adventurePagination.hasMore && !isAdventureLoading) {
      dispatch(fetchAdventurePlaces({ 
        tag: selectedAdventureTag, 
        nextPageToken: adventurePagination.nextPageToken 
      }));
    }
  }, [dispatch, adventurePagination, isAdventureLoading, selectedAdventureTag]);

  const loadMoreDiscoverByNearest = useCallback(() => {
    if (discoverByNearestPagination.hasMore && !isNearestLoading) {
      dispatch(fetchDiscoverByNearest(discoverByNearestPagination.nextPageToken));
    }
  }, [dispatch, discoverByNearestPagination, isNearestLoading]);

  // Adventure tag click handler
  const handleAdventureTagClick = useCallback((tag) => {
    dispatch(setSelectedAdventureTag(tag));
    dispatch(clearAdventurePlaces());
    dispatch(fetchAdventurePlaces({ tag }));
  }, [dispatch]);

  // UI state handlers
  const handleSelectedButtonChange = useCallback((button) => {
    dispatch(setSelectedButton(button));
  }, [dispatch]);

  const handleChatVisibilityChange = useCallback((visible) => {
    dispatch(setIsChatVisible(visible));
  }, [dispatch]);

  // Update live location
  const handleUpdateLiveLocation = useCallback(async (location) => {
    try {
      await dispatch(updateLiveLocation(location)).unwrap();
    } catch (error) {
      console.error('Error updating live location:', error);
    }
  }, [dispatch]);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    dispatch(fetchUnreadNotifications());
  }, [dispatch]);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    initializeData();
  }, [initializeData]);

  return {
    // State
    selectedButton,
    selectedAdventureTag,
    isChatVisible,
    isDiscoverByInterestLoading,
    isMountainsLoading,
    isViewPointsLoading,
    isAdventureLoading,
    isScheduleLoading,
    isPostsLoading,
    isShortsLoading,
    isNearestLoading,
    discoverByInterest,
    mountains,
    viewPoints,
    adventurePlaces,
    allSchedule,
    allPosts,
    allShorts,
    discoverByNearest,
    discoverByInterestPagination,
    mountainsPagination,
    viewPointsPagination,
    adventurePagination,
    shortsPagination,
    discoverByNearestPagination,
    unreadNotifications,
    userLocation,
    errors,

    // Actions
    initializeData,
    loadMoreDiscoverByInterest,
    loadMoreMountains,
    loadMoreViewPoints,
    loadMoreAdventurePlaces,
    loadMoreDiscoverByNearest,
    handleAdventureTagClick,
    handleSelectedButtonChange,
    handleChatVisibilityChange,
    handleUpdateLiveLocation,
    refreshNotifications,
    refreshAllData
  };
}; 