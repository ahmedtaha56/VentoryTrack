import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyScreen = () => {
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
        <Ionicons name="shield-checkmark" size={60} color="#1a73e8" />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>
          We respect your privacy
        </Text>
        <Text style={styles.lastUpdated}>Last Updated: January 2024</Text>
      </View>

      {/* Section 1: Overview */}
      <View style={styles.section}>
        <Section
          title="Our Policy"
          icon="information-circle"
          section="overview"
        >
          <Text style={styles.contentText}>
            We take your privacy very seriously at StockTrack. This policy explains what data we collect and how we keep it safe.
          </Text>
        </Section>
      </View>

      {/* Section 2: Data Collection */}
      <View style={styles.section}>
        <Section
          title="What Data We Collect"
          icon="document"
          section="collection"
        >
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Your name</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Email address</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Phone number</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Product and inventory data</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Login and activity information</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 3: How We Use Data */}
      <View style={styles.section}>
        <Section
          title="How We Use Your Data"
          icon="cog"
          section="usage"
        >
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>To manage your inventory</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>To improve app performance</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>To provide a better user experience</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>To provide technical support</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 4: Data Sharing */}
      <View style={styles.section}>
        <Section
          title="Data Sharing"
          icon="share-social"
          section="sharing"
        >
          <View style={styles.warningBox}>
            <Ionicons name="shield" size={20} color="#d32f2f" />
            <Text style={styles.warningText}>
              We do NOT share your data with third parties
            </Text>
          </View>
          <Text style={styles.contentText}>
            Your information is stored securely on our servers only.
          </Text>
        </Section>
      </View>

      {/* Section 5: Data Security */}
      <View style={styles.section}>
        <Section
          title="Data Security"
          icon="lock-closed"
          section="security"
        >
          <View style={styles.securityFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.featureText}>Data encryption (Data protected in transit)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.featureText}>Secure servers are used</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.featureText}>Regular security audits</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 6: User Rights */}
      <View style={styles.section}>
        <Section
          title="Your Rights"
          icon="person"
          section="rights"
        >
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Right to access your data</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Right to modify your data</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Right to delete your data</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Right to download your data</Text>
            </View>
          </View>
        </Section>
      </View>

      {/* Section 7: Contact */}
      <View style={styles.section}>
        <Section
          title="Questions or Issues"
          icon="mail"
          section="contact"
        >
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Contact us:</Text>
            <Text style={styles.contactEmail}>support@stocktrack.com</Text>
            <Text style={styles.contactPhone}>+92-3XX-XXXXXXX</Text>
          </View>
        </Section>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This policy can be updated at any time
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
  securityFeatures: {
    marginVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
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

export default PrivacyPolicyScreen;