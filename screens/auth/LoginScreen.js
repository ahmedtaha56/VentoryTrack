import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../components/Common';
import { supabase } from '../../lib/supabase';
import { countAdminUsers } from '../../lib/database';
import { AuthContext } from '../../context/Authcontext';
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signIn } = useContext(AuthContext);
  const [signupAllowed, setSignupAllowed] = useState(false);

  useEffect(() => {
    const checkAdminCount = async () => {
      const { count, error } = await countAdminUsers(supabase);
      if (error) {
        console.error("Error checking admin count:", error);
      }
      // Signup is allowed only if we have less than 2 admins
      const canSignup = count < 2;
      console.log(`📊 Admin count: ${count}/2 | Signup allowed: ${canSignup}`);
      setSignupAllowed(canSignup);
    };
    checkAdminCount();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setErrors({ general: result.error || 'Login failed' });
      }
      // The navigation is handled by the RootNavigator based on auth state
    } catch (error) {
      setErrors({ general: 'An error occurred' });
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
          <Text style={styles.title}>StockTrack</Text>
          <Text style={styles.subtitle}>Inventory Management</Text>
        </View>

        <View style={styles.form}>
          {errors.general && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.errorAlertText}>{errors.general}</Text>
            </View>
          )}

          <InputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail"
            error={errors.email}
          />

          <View style={styles.passwordContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.passwordIcon} />
              <TextInput
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                style={styles.passwordInput}
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
          
          {signupAllowed && (
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 StockTrack</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  passwordContainer: {
    marginBottom: 16,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
  },
  passwordIcon: {
    marginRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    color: '#1a73e8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },
  loginButton: {
    marginBottom: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 13,
  },
  signupLink: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});

export default LoginScreen;