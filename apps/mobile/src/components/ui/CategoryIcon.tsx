import React from 'react';
import { Image, StyleSheet } from 'react-native';
import {
    Book, Code, Music, Palette, Calculator, Globe,
    Briefcase, GraduationCap, Lightbulb, Target, Trophy,
    Heart, Star, Zap, Flame, Rocket, Brain, Atom,
    Languages, PenTool, Camera, Video, Headphones,
    Gamepad2, Dumbbell, Utensils, Coffee, Home,
    File, Folder, HelpCircle
} from 'lucide-react-native';

// Mapping of icon names to components
// Note: explicit import is required for tree shaking and React Native compatibility
export const ICON_MAP: Record<string, React.ElementType> = {
    Book, Code, Music, Palette, Calculator, Globe,
    Briefcase, GraduationCap, Lightbulb, Target, Trophy,
    Heart, Star, Zap, Flame, Rocket, Brain, Atom,
    Languages, PenTool, Camera, Video, Headphones,
    Gamepad2, Dumbbell, Utensils, Coffee, Home,
    File, Folder, HelpCircle
};

// List of icons available for selection (excluding internal uses like File/Folder)
export const POPULAR_ICONS = [
    "Book", "Code", "Music", "Palette", "Calculator", "Globe",
    "Briefcase", "GraduationCap", "Lightbulb", "Target", "Trophy",
    "Heart", "Star", "Zap", "Flame", "Rocket", "Brain", "Atom",
    "Languages", "PenTool", "Camera", "Video", "Headphones",
    "Gamepad2", "Dumbbell", "Utensils", "Coffee", "Home"
];

interface CategoryIconProps {
    iconName?: string;
    customIconUri?: string;
    size?: number;
    color?: string;
    style?: any;
}

/**
 * カテゴリアイコンを表示するコンポーネント
 * Lucideアイコンまたはカスタム画像を表示します
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
    iconName,
    customIconUri,
    size = 16,
    color,
    style
}) => {
    // カスタム画像がある場合は画像を表示
    if (customIconUri) {
        return (
            <Image
                source={{ uri: customIconUri }}
                style={[
                    styles.customImage,
                    { width: size, height: size, borderRadius: size / 4 },
                    style
                ]}
            />
        );
    }

    // Lucideアイコンを表示
    if (!iconName) return null;
    const Icon = ICON_MAP[iconName];

    if (!Icon) {
        // Fallback
        return <HelpCircle size={size} color={color} style={style} />;
    }

    return <Icon size={size} color={color} style={style} />;
};

const styles = StyleSheet.create({
    customImage: {
        resizeMode: 'cover',
    },
});
