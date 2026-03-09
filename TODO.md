# Navigation Fix for Settings Screen

## Completed Tasks
- [x] Import HelpSupportScreen, PrivacyPolicyScreen, and TermsConditionsScreen in MoreNavigator.js
- [x] Add Stack.Screen components for HelpSupport, PrivacyPolicy, and TermsConditions in MoreNavigator.js

## Summary
Fixed the React Navigation error where the Settings screen was trying to navigate to 'HelpSupport', 'PrivacyPolicy', and 'TermsConditions' screens that were not registered in the navigator. The screens existed in the 'app info' folder but needed to be added to the MoreNavigator stack.

## Changes Made
- Added imports for the three app info screens in navigation/MoreNavigator.js
- Added Stack.Screen components with appropriate header titles for each screen

The navigation from Settings screen should now work properly without the "action not handled by any navigator" error.
