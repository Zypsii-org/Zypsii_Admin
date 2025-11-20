import MainLanding from './MainLanding/MainLanding'
import ExpenseCalculator from './ExpenseCalculator/ExpenseCalculator'
import ProfileDashboard from './ProfileDashboard/ProfileDashboard'
import Review from './Review/Review'
import FAQ from './FAQ/FAQ'
import ShortsScreen from './Shorts/ShortsScreen'

import DeleteButton from './DeleteScreen/DeleteScreen'
import DummyScreen from './Zipsiprofile/DummyScreen'
import MessageList from './MessageList/MessageList'
import ChatScreen from './Chat/ChatScreen'
import OnboardingScreen from './Onboarding/Onboarding'
import data from '../data/data'
import MySchedule from './MySchedule/MySchedule'
import Destination from './Destination/Destination'
import MakeSchedule from './MakeSchedule/MakeSchedule'
import TripDetail from './TripDetail/TripDetail'
import Map from './Map/Map'
import Schedule from './MySchedule/Schedule/AllSchedule'
import Login from './Login/Login'
import DiscoverPlace from './Discoverplace/Discoverplace'
import SearchPage from './Searchbar/Searchbar'
import Notification from './Notification/Notification'
import CreatePoll from './CreatePoll/CreatePoll'
import PageCreation from './PageCreation/PageCreation'
import ReelUpload from './ReelUpload/ReelUpload'
import LocationPage from './LocationPage/LocationPage'
import SignUp from './SignUp/SignUp'
import FavoritesPage from './Favourite/Favourite'
import LogoutButton from './Logout/Logout'
import MapScreen from './mapscreen/MapScreen '
import FollowersList from './FollowersList/FollowersList'
import GuideDetail from './GuideDetail/GuideDetail'

// Splitwise screens
import SplitwiseHome from './Split/SplitwiseHomeScreen'
import GroupsScreen from './Split/GroupsScreen'
import CreateGroup from './Split/CreateGroupScreen'
import GroupDetails from './Split/GroupDetailsScreen'
import AddExpense from './Split/AddExpenseScreen'
import ExpenseDetails from './Split/ExpenseDetailsScreen'
import AllExpenses from './Split/AllExpensesScreen'
import SettleUp from './Split/SettleUpScreen'
import BalanceHistory from './Split/BalanceHistoryScreen'

// Alias components for navigation compatibility
const SplitDashboard = SplitwiseHome;
const CreateSplit = CreateGroup;  // Map CreateSplit to CreateGroup
const SplitDetail = GroupDetails; // Map SplitDetail to GroupDetails

import ShortsUpload from './ShortsUpload/ShortsUpload'
import PostUpload from './PostUpload/PostUpload'
import UserProfile from './UserProfile/UserProfile.js'
import CombinedDestinations from './CombinedDestinations/CombinedDestinations'


export {

  data,
  MainLanding,
  ExpenseCalculator,
  ProfileDashboard,
  MapScreen,
  Review,
  FavoritesPage,
  DeleteButton,
  DummyScreen,
  MessageList,
  ChatScreen,
  DiscoverPlace,
  OnboardingScreen,
  MySchedule,
  Destination,
  MakeSchedule,
  TripDetail,
  Map,
  Schedule,
  Login,
  SearchPage,
  Notification,
  CreatePoll,
  PageCreation,
  ReelUpload,
  LocationPage,
  SignUp,
  LogoutButton,
  FollowersList,
  FAQ,
  GuideDetail,
  // Splitwise screens
  SplitwiseHome,
  SplitDashboard,
  GroupsScreen,
  CreateGroup,
  CreateSplit,
  GroupDetails,
  SplitDetail,
  AddExpense,
  ExpenseDetails,
  AllExpenses,
  SettleUp,
  BalanceHistory,

  ShortsUpload,
  PostUpload,
  ShortsScreen,
  UserProfile,
  CombinedDestinations
}
