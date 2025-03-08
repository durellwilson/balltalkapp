import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet,
  StyleProp,
  ViewStyle
} from 'react-native';
import { createShadow } from '../../utils/shadowStyles';

export interface ActionButtonProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  style, 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style
      ]}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow(0, 1, 1.5, 0.2),
  },
  buttonDisabled: {
    opacity: 0.5,
  }
});

export default ActionButton;
