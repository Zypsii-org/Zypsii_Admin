import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { colors } from '../utils/colors';

class NotificationService {
  // Hardcoded notification content
  static NOTIFICATION_CONTENT = {
    title: 'New Reel Uploaded',
    body: 'Check out the latest reel from your favorite creator!',
    data: {
      type: 'reel',
      action: 'view_reel',
      timestamp: new Date().toISOString()
    }
  };

  static async sendNotification(expoPushToken) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        ...this.NOTIFICATION_CONTENT,
        priority: 'high',
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendReelNotification(uploaderName, expoPushToken) {
    // Use the hardcoded content but update the body with the uploader's name
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: this.NOTIFICATION_CONTENT.title,
      body: `${uploaderName} uploaded a new reel!`,
      data: this.NOTIFICATION_CONTENT.data,
      priority: 'high',
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending reel notification:', error);
    }
  }

  // New method to send a test notification
  static async sendTestNotification() {
    await this.sendNotification(
      'Test Notification',
      'This is a test notification sent from the app',
      {
        type: 'test',
        timestamp: new Date().toISOString(),
      }
    );
  }

  static async sendFollowNotification(followerName, expoPushToken) {
    await this.sendNotification(
      'New Follower',
      `${followerName} started following you`,
      {
        type: 'follow',
        expoPushToken,
      }
    );
  }

  static async sendCommentNotification(commenterName, expoPushToken) {
    await this.sendNotification(
      'New Comment',
      `${commenterName} commented on your post`,
      {
        type: 'comment',
        expoPushToken,
      }
    );
  }

  static async sendLikeNotification(likerName, expoPushToken) {
    await this.sendNotification(
      'New Like',
      `${likerName} liked your post`,
      {
        type: 'like',
        expoPushToken,
      }
    );
  }

  static async sendScheduleNotification(scheduleName, expoPushToken) {
    await this.sendNotification(
      'New Schedule',
      `New schedule "${scheduleName}" has been created`,
      {
        type: 'schedule',
        expoPushToken,
      }
    );
  }
}

export default NotificationService; 