import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TermsConditionsScreen = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const Section = ({ title, icon, section, children }) => (
    <TouchableOpacity
      style={styles.sectionCard}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <Ionicons name={icon} size={24} color="#1a73e8" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expandedSection === section ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#999"
        />
      </View>
      {expandedSection === section && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Ionicons name="document-text" size={60} color="#1a73e8" />
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <Text style={styles.headerSubtitle}>
          Please read these terms carefully before using our app
        </Text>
        <Text style={styles.lastUpdated}>Last Updated: January 2024</Text>
      </View>

      {/* Section 1: Agreement */}
      <View style={styles.section}>
        <Section
          title="Agreement"
          icon="handshake"
          section="agreement"
        >
          <Text style={styles.contentText}>
            By using this app, you agree to the following terms:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Provide accurate information</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Do not misuse the app</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Comply with all laws</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 2: User Responsibility */}
      <View style={styles.section}>
        <Section
          title="User Responsibility"
          icon="person-circle"
          section="responsibility"
        >
          <Text style={styles.contentText}>
            You are responsible for:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Keeping your username and password secure</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Accuracy of information you provide</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>All data you upload</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Maintaining your account security</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 3: Prohibited Activities */}
      <View style={styles.section}>
        <Section
          title="Prohibited Activities"
          icon="close-circle"
          section="prohibited"
        >
          <Text style={styles.contentText}>
            You cannot misuse this app by:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Accessing other users' accounts</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Providing false information</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Disrupting app functionality</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Harassing other users</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 4: Admin Rights */}
      <View style={styles.section}>
        <Section
          title="Admin Rights"
          icon="shield"
          section="admin"
        >
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.warningText}>
              Admin can manage user access at any time
            </Text>
          </View>
          <Text style={styles.contentText}>
            The admin has the following rights:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Restrict user access</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>View and manage data</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Penalize unauthorized users</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 5: Limitation of Liability */}
      <View style={styles.section}>
        <Section
          title="Limitation of Liability"
          icon="information-circle"
          section="liability"
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#1a73e8" />
            <Text style={styles.infoText}>
              We are not responsible for data loss caused by user error
            </Text>
          </View>
          <Text style={styles.contentText}>
            Please be careful with your information and keep your data safe.
          </Text>
        </Section>
      </View>

      {/* Section 6: Account Suspension */}
      <View style={styles.section}>
        <Section
          title="Account Suspension"
          icon="lock"
          section="suspension"
        >
          <Text style={styles.contentText}>
            We may suspend your account if you violate these terms:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>If you misuse the app</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>For non-payment</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>For threats or violence</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 7: Updates to Terms */}
      <View style={styles.section}>
        <Section
          title="Updates to Terms"
          icon="refresh"
          section="updates"
        >
          <Text style={styles.contentText}>
            We may update these terms at any time. If we make major changes, we will notify you. By using the app after updates, you accept the new terms.
          </Text>
        </Section>
      </View>

      {/* Section 8: Contact & Support */}
      <View style={styles.section}>
        <Section
          title="Contact"
          icon="mail"
          section="contact"
        >
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>If you have any questions, please contact us:</Text>
            <Text style={styles.contactEmail}>support@stocktrack.com</Text>
            <Text style={styles.contactPhone}>+92-3XX-XXXXXXX</Text>
          </View>
        </Section>
      </View>

      {/* Acknowledgment */}
      <View style={styles.section}>
        <View style={styles.acknowledgmentBox}>
          <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          <View style={styles.acknowledgmentText}>
            <Text style={styles.acknowledgmentTitle}>Your Consent</Text>
            <Text style={styles.acknowledgmentDesc}>
              By using the app, you agree to all these terms
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Terms can always be updated
        </Text>
        <Text style={styles.footerSubtext}>StockTrack © 2024</Text>
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
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  contentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletList: {
    marginVertical: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    color: '#1a73e8',
    marginRight: 10,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#d32f2f',
    marginLeft: 10,
    flex: 1,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1a73e8',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  contactBox: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 12,
    color: '#1a73e8',
    marginBottom: 4,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '500',
  },
  acknowledgmentBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  acknowledgmentText: {
    marginLeft: 12,
    flex: 1,
  },
  acknowledgmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  acknowledgmentDesc: {
    fontSize: 12,
    color: '#558b2f',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#ccc',
  },
});

export default TermsConditionsScreen;