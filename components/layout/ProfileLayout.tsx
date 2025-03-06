import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { defaultTheme, ThemeType } from '../../constants';
import { Text } from '../themed';

// ProfileLayout props
export interface ProfileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  theme?: ThemeType;
  scrollable?: boolean;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  contentContainerStyle?: any;
}

/**
 * ProfileLayout component
 * 
 * A layout component for profile screens with a header and optional back button.
 */
const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  children,
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  theme = defaultTheme,
  scrollable = true,
  headerComponent,
  footerComponent,
  contentContainerStyle,
}) => {
  const router = useRouter();

  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Render header
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}

        {title && (
          <Text
            variant="h4"
            style={[
              styles.title,
              { color: theme.colors.text },
              showBackButton && styles.titleWithBack,
            ]}
          >
            {title}
          </Text>
        )}

        <View style={styles.rightComponentContainer}>
          {rightComponent}
        </View>
      </View>

      {headerComponent && (
        <View style={styles.headerComponentContainer}>
          {headerComponent}
        </View>
      )}
    </View>
  );

  // Render content
  const renderContent = () => {
    const content = (
      <View style={[styles.content, contentContainerStyle]}>
        {children}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  // Render footer
  const renderFooter = () => {
    if (!footerComponent) return null;

    return (
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        {footerComponent}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  titleWithBack: {
    marginLeft: -40, // Offset for the back button to center the title
  },
  rightComponentContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerComponentContainer: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
});

export default ProfileLayout;
