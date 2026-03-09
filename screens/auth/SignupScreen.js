import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../components/Common';
import { AuthContext } from '../../context/Authcontext';
import { supabase } from '../../lib/supabase';
import { countAdminUsers } from '../../lib/database';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [canSignup, setCanSignup] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const { signUp } = useContext(AuthContext);

  useEffect(() => {
    const checkAdminLimit = async () => {
      const { count } = await countAdminUsers(supabase);
      setAdminCount(count);
      setCanSignup(count < 2);
      
      if (count >= 2) {
        Alert.alert(
          'Signup Closed',
          'Admin limit reached. Only login is available. Contact an admin for access.'
        );
        setTimeout(() => {
          navigation.replace('Login');
        }, 1000);
      }
    };
    checkAdminLimit();
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Since this screen is only accessible when no users exist,
      // the first user to sign up is always the admin.
      const result = await signUp(name, email, password, 'admin');

      if (!result.success) {
        setErrors({ general: result.error || 'Signup failed' });
      }
      // On success, the AuthProvider and RootNavigator will handle navigation.
    } catch (error) {
      setErrors({ general: 'An error occurred during sign up.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="cube" size={50} color="#fff" />
          </View>
          <Text style={styles.title}>Create Admin Account</Text>
          <Text style={styles.subtitle}>
            Admin slots: {adminCount}/2 | {2 - adminCount} remaining
          </Text>
        </View>

        <View style={styles.form}>
          {!canSignup && (
            <View style={styles.warningAlert}>
              <Ionicons name="lock-closed" size={20} color="#ff6f00" />
              <Text style={styles.warningAlertText}>
                Admin limit reached. Please login or contact an administrator.
              </Text>
            </View>
          )}

          {errors.general && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.errorAlertText}>{errors.general}</Text>
            </View>
          )}

          <InputField
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            icon="person"
            error={errors.name}
          />

          <InputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail"
            error={errors.email}
          />

          <InputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed"
            error={errors.password}
          />

          <InputField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon="lock-closed"
            error={errors.confirmPassword}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            disabled={!canSignup}
            style={styles.signupButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#d32f2f',
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6f00',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  warningAlertText: {
    color: '#ff6f00',
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 13,
  },
  loginLink: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default SignupScreen;