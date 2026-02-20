import { Dimensions } from 'react-native';

export const CARDS_STORAGE_KEY = "user_cards";
export const USAGE_STORAGE_KEY = "card_usage_history";

const { width: SCREEN_W } = Dimensions.get("window");
export const SCREEN_WIDTH = SCREEN_W;
export const CARD_MARGIN = 24;
export const CARD_W = SCREEN_W - CARD_MARGIN * 2;
export const CARD_ASPECT_RATIO = 1.586;
export const CARD_H = CARD_W / CARD_ASPECT_RATIO;
