import { themes } from '@/constants/theme';
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

const HomeHeader = React.memo(
    ({ onProfilePress }: { onProfilePress: () => void }) => (
        <View style={styles.header}>
            <View style={styles.headerContainer}>
                <Text style={styles.logo}>
                    <Text style={styles.logoHighlight}>Errand</Text>
                    <Text style={styles.logoNormal}> Assistant</Text>
                </Text>

                <Pressable style={styles.profileButton}
                    onPress={onProfilePress}
                    accessibilityLabel='Profile'
                    accessibilityRole='button'
                    accessibilityHint='View your profile'>
                    <Ionicons name='person-circle-outline' size={32} color={themes.light.colors.primaryDark} />
                </Pressable>
            </View>
        </View>
    ),
);
HomeHeader.displayName = 'HomeHeader';

export default HomeHeader;

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
        paddingBottom: 12,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: 24,
        fontWeight: '700',
    },
    logoHighlight: {
        color: themes.light.colors.primary,
    },
    logoNormal: {
        color: themes.light.colors.text,
    },
    profileButton: {
        padding: 8,
        borderRadius: 18,
        backgroundColor: themes.light.colors.surface,
        borderWidth: 1,
        borderColor: themes.light.colors.border,
        ...Platform.select({
            ios: {
                shadowColor: themes.light.colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
});
