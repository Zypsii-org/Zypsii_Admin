import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import navigationService from './navigationService';
import * as Notifications from 'expo-notifications';
import * as Screen from '../screens';
import TripMap from '../screens/TripMap/TripMap';
import PlaceDetailsScreen from '../screens/Searchbar/PlaceDetailsScreen';
import CombinedDestinations from '../screens/CombinedDestinations/CombinedDestinations';
import PostDetail from '../screens/Zipsiprofile/PostDetail';
import EditSchedule from '../screens/MySchedule/EditSchedule';
import EditMapScreen from '../screens/MySchedule/EditMapScreen';
import { useAuth } from '../components/Auth/AuthContext';

const NavigationStack = createStackNavigator();
const MainStack = createStackNavigator();

// Navigation Stack for screens without Drawer
function Drawer() {
  return (
    <NavigationStack.Navigator screenOptions={{ headerShown: false }}>
      <NavigationStack.Screen name="MainLanding" component={Screen.MainLanding} />
      {/* Alias for Splitwise home to match navigation calls */}
      <NavigationStack.Screen name="SplitwiseHome" component={Screen.SplitwiseHome} />
      <NavigationStack.Screen name="ExpenseCalculator" component={Screen.ExpenseCalculator} />
      <NavigationStack.Screen name="DeleteButton" component={Screen.DeleteButton} />
      <NavigationStack.Screen name="Logout" component={Screen.LogoutButton} />
      <NavigationStack.Screen name="ProfileDashboard" component={Screen.ProfileDashboard} />
      <NavigationStack.Screen name="Review" component={Screen.Review} />
      <NavigationStack.Screen name="DummyScreen" component={Screen.DummyScreen} />
      <NavigationStack.Screen name="PostDetail" component={PostDetail} />
      <NavigationStack.Screen name="WhereToGo" component={Screen.DiscoverPlace} />
      <NavigationStack.Screen name="MySchedule" component={Screen.MySchedule}/>
      <NavigationStack.Screen name="EditSchedule" component={EditSchedule}/>
      <NavigationStack.Screen name="EditMapScreen" component={EditMapScreen}/>
      <NavigationStack.Screen name="Destination" component={Screen.Destination}/>
      <NavigationStack.Screen name="MakeSchedule" component={Screen.MakeSchedule}/>
      <NavigationStack.Screen name="TripDetail" component={Screen.TripDetail}/>
      <NavigationStack.Screen name="Map" component={Screen.Map}/>
      <NavigationStack.Screen name="DiscoverPlace" component={Screen.DiscoverPlace} />
      <NavigationStack.Screen name='SearchPage' component={Screen.SearchPage}/>
      <NavigationStack.Screen name='Notification' component={Screen.Notification}/>
      <NavigationStack.Screen name='CreatePoll' component={Screen.CreatePoll}/>
      <NavigationStack.Screen name='PageCreation' component={Screen.PageCreation}/>
      <NavigationStack.Screen name='ReelUpload' component={Screen.ReelUpload}/>
      <NavigationStack.Screen name='LocationPage' component={Screen.LocationPage}/>
      <NavigationStack.Screen name="ChatScreen" component={Screen.ChatScreen} />
      <NavigationStack.Screen name="MessageList" component={Screen.MessageList} />
      <NavigationStack.Screen name="SignUp" component={Screen.SignUp} />
      <NavigationStack.Screen name="Favourite" component={Screen.FavoritesPage} />
      <NavigationStack.Screen name="MapScreen" component={Screen.MapScreen} />
      <NavigationStack.Screen name="FollowersList" component={Screen.FollowersList} />
      <NavigationStack.Screen name="FAQ" component={Screen.FAQ} />
      <NavigationStack.Screen name="SplitDashboard" component={Screen.SplitDashboard} />
      <NavigationStack.Screen name="GroupsScreen" component={Screen.GroupsScreen} />
      <NavigationStack.Screen name="CreateGroup" component={Screen.CreateGroup} />
      <NavigationStack.Screen name="CreateSplit" component={Screen.CreateSplit} />
      <NavigationStack.Screen name="SplitDetail" component={Screen.SplitDetail} />
      <NavigationStack.Screen name="AddExpense" component={Screen.AddExpense} />
      <NavigationStack.Screen name="AllExpenses" component={Screen.AllExpenses} />
      <NavigationStack.Screen name="ExpenseDetails" component={Screen.ExpenseDetails} />
      <NavigationStack.Screen name="GroupDetails" component={Screen.GroupDetails} />
      <NavigationStack.Screen name="SettleUp" component={Screen.SettleUp} />
      <NavigationStack.Screen name="TripMap" component={TripMap} />
      <NavigationStack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
      <NavigationStack.Screen name="CombinedDestinations" component={CombinedDestinations} />
      <NavigationStack.Screen name='ShortsUpload' component={Screen.ShortsUpload}/>
      <NavigationStack.Screen name='PostUpload' component={Screen.PostUpload}/>
      <NavigationStack.Screen name='UserProfile' component={Screen.UserProfile}/>
      <NavigationStack.Screen name='AllShorts' component={Screen.ShortsScreen}/>
      <NavigationStack.Screen name='Shorts' component={Screen.ShortsScreen}/>
      <NavigationStack.Screen name="GuideDetail" component={Screen.GuideDetail} />
      
    </NavigationStack.Navigator>
  );
}

// Main App Container
function AppContainer() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or show a loading spinner
  }

  return (
    <NavigationContainer
      ref={ref => {
        navigationService.setGlobalRef(ref);
      }}>
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none'
        }}
        initialRouteName={user ? "Drawer" : "Login"}
      >
        {user ? (
          <MainStack.Screen
            name="Drawer"
            component={Drawer}
          />
        ) : (
          <>
            <MainStack.Screen
              name="Login"
              component={Screen.Login}
            />
            <MainStack.Screen
              name="SignUp"
              component={Screen.SignUp}
            />
          </>
        )}
      </MainStack.Navigator>
    </NavigationContainer>
  );
}

export default AppContainer;