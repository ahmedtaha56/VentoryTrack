import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Card,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@stocktrack.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+92-3XX-XXXXXXX');
  };

  const handleWhatsAppPress = () => {
    Linking.openURL('whatsapp://send?phone=923XXXXXXXXX');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <Ionicons name="help-circle" size={60} color="#1a73e8" />
        <Text style={styles.headerTitle}>Need Help?</Text>
        <Text style={styles.headerSubtitle}>
          If you are facing any issue while using the app, feel free to contact us.
        </Text>
      </View>

      {/* Contact Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        {/* Email Card */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={handleEmailPress}
        >
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail" size={28} color="#1a73e8" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@stocktrack.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Phone Card */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={handlePhonePress}
        >
          <View style={styles.contactIconContainer}>
            <Ionicons name="call" size={28} color="#1a73e8" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+92-3XX-XXXXXXX</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* WhatsApp Card */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={handleWhatsAppPress}
        >
          <View style={styles.contactIconContainer}>
            <Ionicons name="chatbubble" size={28} color="#25D366" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>+92-3XX-XXXXXXX</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Support Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Hours</Text>
        <View style={styles.hoursCard}>
          <View style={styles.hoursRow}>
            <Ionicons name="time" size={20} color="#1a73e8" />
            <Text style={styles.hoursText}>Monday - Saturday</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursTime}>10:00 AM - 6:00 PM</Text>
          </View>
        </View>
      </View>

      {/* Common Issues */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Issues</Text>

        <View style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <Ionicons name="lock-closed" size={20} color="#d32f2f" />
            <Text style={styles.issueTitle}>Unable to login</Text>
          </View>
          <Text style={styles.issueDescription}>
            Please check your username and password again. If the problem persists, please contact us.
          </Text>
        </View>

        <View style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <Ionicons name="save" size={20} color="#d32f2f" />
            <Text style={styles.issueTitle}>Product not saving</Text>
          </View>
          <Text style={styles.issueDescription}>
            Check your internet connection and try again. Make sure you fill all required fields.
          </Text>
        </View>

        <View style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <Ionicons name="shield" size={20} color="#d32f2f" />
            <Text style={styles.issueTitle}>Permission issue</Text>
          </View>
          <Text style={styles.issueDescription}>
            You may not have permission to use this feature. Please contact your administrator.
          </Text>
        </View>

        <View style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <Ionicons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.issueTitle}>App not responding</Text>
          </View>
          <Text style={styles.issueDescription}>
            Close the app and reopen it. If the issue persists, please reinstall the app.
          </Text>
        </View>
      </View>

      {/* FAQ Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.faqButton}>
          <Ionicons name="help" size={20} color="#fff" />
          <Text style={styles.faqButtonText}>View Frequently Asked Questions</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>We are here to help you</Text>
        <Text style={styles.footerSubtext}>StockTrack Support Team</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a73e8',
  },
  hoursCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  hoursTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 32,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  issueDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  faqButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  faqButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#ccc',
  },
});

export default HelpSupportScreen;