import { themes } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

interface InputFieldProps extends TextInputProps {
    icon: keyof typeof Ionicons.glyphMap;
    error?: string;
    isPassword?: boolean;
}

const InputField = React.memo(({ icon, error, isPassword, style, ...props }: InputFieldProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ANIMATION FOR BORDER COLOR TRANSITION
    const borderColorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(borderColorAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false, // color interpolation doesn't support native driver
        }).start();
    }, [isFocused]);

    const borderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [themes.light.colors.border, themes.light.colors.borderHard],
    });

    return (
        <View style={styles.inputContainer}>
            <Animated.View style={[styles.inputWrapper, { borderColor }]}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={themes.light.colors.textSecondary}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={themes.light.colors.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    selectionColor={themes.light.colors.primary}
                    {...props}
                />
                {isPassword && (
                    <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={themes.light.colors.textSecondary}
                        />
                    </Pressable>
                )}
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themes.light.colors.surface,
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: themes.light.colors.text,
        height: '100%',
    },
});

export default InputField;
