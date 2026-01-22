import React from 'react';
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
    size?: number;
    color?: string;
    style?: any;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 16, color, style }) => {
    const defaultColor = color; // If undefined, Icon will use its default or inherit

    if (!iconName) return null;
    const Icon = ICON_MAP[iconName];

    if (!Icon) {
        // Fallback or nothing
        return <HelpCircle size={size} color={defaultColor} style={style} />;
    }

    return <Icon size={size} color={defaultColor} style={style} />;
};
