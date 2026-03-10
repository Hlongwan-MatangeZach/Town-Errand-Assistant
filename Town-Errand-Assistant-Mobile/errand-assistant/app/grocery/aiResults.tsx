import { themes } from "@/constants/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";

const MEAL_FOCUS_MAP: Record<string, { icon: any; color: string }> = {
  "all meals": { icon: "food-variant", color: "#F2994A" },
  breakfast: { icon: "egg-fried", color: "#FFC107" },
  dinners: { icon: "silverware-fork-knife", color: "#4CAF50" },
  lunchbox: { icon: "bag-personal", color: "#03A9F4" },
  braai: { icon: "fire", color: "#E17A47" },
};

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (
    name.includes("produce") ||
    name.includes("veg") ||
    name.includes("fruit")
  )
    return "leaf";
  if (name.includes("meat") || name.includes("protein"))
    return "food-drumstick";
  if (name.includes("dairy")) return "cheese";
  if (name.includes("snack") || name.includes("sweet")) return "cookie";
  if (name.includes("toiletries")) return "bottle-tonic-plus-outline";
  if (name.includes("cleaning")) return "spray-bottle";
  if (name.includes("baby")) return "baby-carriage";
  if (name.includes("drink") || name.includes("beverage")) return "cup-water";
  if (name.includes("bakery") || name.includes("bread")) return "baguette";
  if (
    name.includes("staples") ||
    name.includes("pantry") ||
    name.includes("grocery")
  )
    return "basket-outline";
  return "cart-outline";
};

const getCategoryColor = (categoryName: string, index: number) => {
  const customColors = [
    "#F97316",
    "#F59E0B",
    "#06B6D4",
    "#8B5CF6",
    "#3B82F6",
    "#EC4899",
  ];
  return customColors[index % customColors.length];
};

interface GroceryItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  checked: boolean;
}

interface GroceryCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: GroceryItem[];
}

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <View style={[styles.card, style]}>{children}</View>;

const CategoryCard = ({
  category,
  isExpanded,
  onToggle,
  onToggleItem,
}: {
  category: GroceryCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleItem: (itemId: string) => void;
}) => {
  return (
    <View style={styles.categoryContainer}>
      <Pressable
        style={[
          styles.categoryHeader,
          isExpanded && styles.categoryHeaderExpanded,
        ]}
        onPress={onToggle}
      >
        <View style={styles.categoryHeaderLeft}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: `${category.color}15` },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={22}
              color={category.color}
            />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <View style={styles.categoryHeaderRight}>
          <Text style={styles.itemCountText}>
            {category.items.length} items
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={themes.light.colors.text}
          />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.categoryBody}>
          {category.items.map((item, idx) => (
            <Pressable
              key={item.id}
              style={[
                styles.groceryItemRow,
                idx === category.items.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => onToggleItem(item.id)}
            >
              <View
                style={[styles.checkbox, item.checked && styles.checkboxActive]}
              >
                {item.checked && (
                  <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                )}
              </View>
              <Text
                style={[
                  styles.groceryItemText,
                  item.checked && styles.groceryItemTextChecked,
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.groceryItemPrice}>{item.price}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default function SmartGroceryPlan() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [expandedCategories, setExpandedCategories] = useState<string[]>(["1"]);
  const [groceryData, setGroceryData] = useState<GroceryCategory[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [info, setInfo] = useState({
    budget: 0,
    familySize: "0",
    estimatedSpend: 0,
    mealFocus: "All Meals",
  });

  useEffect(() => {
    if (params.resultData) {
      try {
        const parsed = JSON.parse(params.resultData as string);
        let totalSpend = 0;

        const newGroceryData = parsed.recommendations.map(
          (cat: any, index: number) => ({
            id: String(index + 1),
            title: cat.category,
            icon: getCategoryIcon(cat.category),
            color: getCategoryColor(cat.category, index),
            items: cat.items.map((item: any, i: number) => {
              const priceNum =
                parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
              totalSpend += priceNum;
              return {
                id: `item-${index}-${i}`,
                name: item.name,
                price: item.price,
                priceNum: priceNum,
                checked: false,
              };
            }),
          }),
        );

        const finalTips =
          Array.isArray(parsed.aiTips) && parsed.aiTips.length > 0
            ? parsed.aiTips
            : [
                "Stick to your selected categories for maximum savings.",
                "Review the estimated spend vs your budget before shopping.",
                "Check your pantry for items you might already have.",
              ];

        setAiTips(finalTips);
        setGroceryData(newGroceryData);

        // Parse budget properly
        const cleanBudget =
          parseFloat((parsed.budget || "0").replace(/[^\d.]/g, "")) || 0;

        setInfo({
          budget: cleanBudget,
          familySize: parsed.familySize || "1",
          estimatedSpend: totalSpend,
          mealFocus: parsed.mealFocus || "Breakfast, Lunch, Dinner",
        });

        setExpandedCategories(newGroceryData.map((c: any) => c.id));
      } catch (e) {
        console.error("Error parsing AI results:", e);
      }
    }
  }, [params.resultData]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id],
    );
  };

  const toggleItemCheck = (categoryId: string, itemId: string) => {
    setGroceryData((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
    );
  };

  const handleExport = async () => {
    try {
      const BASKETS_STORAGE_KEY = "@grocery_baskets";
      const storedBaskets = await AsyncStorage.getItem(BASKETS_STORAGE_KEY);
      const baskets = storedBaskets ? JSON.parse(storedBaskets) : [];

      const newBasketId = `basket_${Date.now()}`;

      const newItems = groceryData.flatMap((cat) =>
        cat.items.map((item) => ({
          id: `item_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          name: item.name,
          quantity: "1",
          category: cat.title,
          estimatedPrice: item.priceNum || null,
          completed: item.checked, // Persist checked state
          addedDate: new Date().toISOString(),
          scanned: false,
          fromAI: true,
        })),
      );

      const newBasket = {
        id: newBasketId,
        name: `Smart Plan - ${new Date().toLocaleDateString()}`,
        items: newItems,
        completed: false,
        createdAt: new Date().toISOString(),
        budget: info.budget || null,
        aiGenerated: true,
      };

      const updatedBaskets = [newBasket, ...baskets];
      await AsyncStorage.setItem(
        BASKETS_STORAGE_KEY,
        JSON.stringify(updatedBaskets),
      );

      router.push("/grocery/myBasket");
    } catch (error) {
      console.error("Error exporting basket:", error);
    }
  };

  // Calculate budget status
  const difference = info.budget - info.estimatedSpend;
  const isOverBudget = difference < 0;
  const progressPercentage =
    info.budget > 0
      ? Math.min((info.estimatedSpend / info.budget) * 100, 100)
      : 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={themes.light.colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent} // Adds padding at bottom for footer
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={themes.light.colors.text}
              />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Smart Grocery Plan</Text>
              <Text style={styles.headerSubtitle}>
                Family of {info.familySize} • AI Generated
              </Text>
            </View>
          </View>
          <View style={styles.sparkleIcon}>
            <Ionicons
              name="sparkles"
              size={20}
              color={themes.light.colors.primary}
            />
          </View>
        </View>

        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          {/* Budget Card */}
          <Card style={styles.summaryCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Budget Plan</Text>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={18}
                color={themes.light.colors.text}
              />
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.budgetRow}>
                <Text style={styles.summaryTextLight}>Budget</Text>
                <Text style={styles.summaryTextDark}>
                  R {info.budget.toFixed(0)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.summaryTextLight}>Est. Spend</Text>
                <Text style={styles.summaryTextDark}>
                  R {info.estimatedSpend.toFixed(0)}
                </Text>
              </View>
            </View>

            <View style={styles.pillRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isOverBudget
                      ? `${themes.light.colors.danger}15`
                      : `${themes.light.colors.success}15`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    isOverBudget
                      ? "alert-circle-outline"
                      : "check-circle-outline"
                  }
                  size={14}
                  color={
                    isOverBudget
                      ? themes.light.colors.danger
                      : themes.light.colors.success
                  }
                />
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: isOverBudget
                        ? themes.light.colors.danger
                        : themes.light.colors.success,
                    },
                  ]}
                >
                  {isOverBudget
                    ? `R ${Math.abs(difference).toFixed(0)} Over`
                    : `R ${difference.toFixed(0)} Saved`}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isOverBudget
                      ? themes.light.colors.danger
                      : progressPercentage > 85
                        ? themes.light.colors.warning
                        : themes.light.colors.success,
                  },
                ]}
              />
            </View>
          </Card>

          {/* Meal Coverage Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Meal Coverage</Text>

            <View style={styles.mealStats}>
              <Text style={styles.summaryTextSmall}>Covers 30 days</Text>
              <Text style={styles.summaryTextSmall}>
                Includes {info.mealFocus.toLowerCase()}
              </Text>
              <Text style={styles.summaryTextSmall}>
                Optimized for selected diet
              </Text>
            </View>

            <View style={styles.mealIconsRow}>
              {info.mealFocus.split(", ").map((focus, idx, arr) => {
                const mapItem =
                  MEAL_FOCUS_MAP[focus.trim().toLowerCase()] ||
                  MEAL_FOCUS_MAP["all meals"];
                return (
                  <View
                    key={idx}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View style={styles.emojiBubble}>
                      <MaterialCommunityIcons
                        name={mapItem.icon}
                        size={20}
                        color={mapItem.color}
                      />
                    </View>
                    {idx < arr.length - 1 && (
                      <Text
                        style={{
                          marginHorizontal: 4,
                          color: themes.light.colors.text,
                        }}
                      >
                        +
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Grocery List Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>Your Grocery List</Text>
          <Text style={styles.sectionHeaderMeta}>
            {groceryData.reduce((acc, cat) => acc + cat.items.length, 0)} Items
          </Text>
        </View>

        <Card style={styles.listCardWrapper}>
          {groceryData.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <CategoryCard
                category={cat}
                isExpanded={expandedCategories.includes(cat.id)}
                onToggle={() => toggleCategory(cat.id)}
                onToggleItem={(itemId) => toggleItemCheck(cat.id, itemId)}
              />
              {index < groceryData.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </Card>

        {/* AI Tips Section */}
        <View style={styles.aiTipsWrapper}>
          <View style={styles.aiTipsCard}>
            {/* Decorative element top right */}
            <View style={styles.aiGlowEffect} />

            <View style={styles.aiHeader}>
              <View style={styles.aiIconWrapper}>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={themes.light.colors.primary}
                />
              </View>
              <Text style={styles.aiTitle}>AI Smart Tips</Text>
            </View>

            <View style={styles.aiList}>
              {aiTips.map((tip, index) => (
                <View key={index} style={styles.bulletRow}>
                  <View style={styles.bulletIconContainer}>
                    <MaterialCommunityIcons
                      name="star-four-points"
                      size={16}
                      color={themes.light.colors.primary}
                    />
                  </View>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Decorative Elements */}
            <MaterialCommunityIcons
              name="creation"
              size={120}
              color={themes.light.colors.primary}
              style={styles.bgDecoration}
            />
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={themes.light.colors.text}
            />
            <Text style={styles.secondaryButtonText}>Regenerate</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleExport}>
            <MaterialCommunityIcons
              name="export-variant"
              size={20}
              color={themes.light.colors.surface}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>Export to Basket</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themes.light.colors.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: themes.light.colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: themes.light.colors.text,
    fontWeight: "500",
    marginTop: 2,
  },
  sparkleIcon: {
    backgroundColor: `${themes.light.colors.primary}15`,
    padding: 8,
    borderRadius: 20,
  },

  // Cards General
  card: {
    backgroundColor: themes.light.colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },

  // Summary Row
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    marginBottom: 0,
    justifyContent: "space-between",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: themes.light.colors.text,
  },

  // Budget Specifics
  budgetStats: {
    marginBottom: 12,
    gap: 4,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTextLight: {
    fontSize: 12,
    color: themes.light.colors.text,
    fontWeight: "500",
  },
  summaryTextDark: {
    fontSize: 13,
    color: themes.light.colors.text,
    fontWeight: "700",
  },
  pillRow: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Meal Focus Specifics
  mealStats: {
    marginBottom: 12,
  },
  mealFocusText: {
    fontSize: 13,
    fontWeight: "700",
    color: themes.light.colors.primary,
    marginBottom: 4,
  },
  summaryTextSmall: {
    fontSize: 11,
    color: themes.light.colors.text,
    lineHeight: 16,
  },
  mealIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  emojiBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  emoji: {
    fontSize: 16,
  },

  // Grocery List
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: themes.light.colors.text,
  },
  sectionHeaderMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: themes.light.colors.text,
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listCardWrapper: {
    padding: 0,
    overflow: "hidden",
  },
  categoryContainer: {
    backgroundColor: "transparent",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
  },
  categoryHeaderExpanded: {
    backgroundColor: "#FAFAFA",
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: themes.light.colors.text,
    marginLeft: 12,
  },
  categoryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemCountText: {
    fontSize: 12,
    color: themes.light.colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: themes.light.colors.border,
  },
  categoryBody: {
    backgroundColor: "#FAFAFA",
  },
  groceryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: themes.light.colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  checkboxActive: {
    backgroundColor: themes.light.colors.success,
    borderColor: themes.light.colors.success,
  },
  groceryItemText: {
    fontSize: 14,
    color: themes.light.colors.text,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  groceryItemTextChecked: {
    color: themes.light.colors.text,
    textDecorationLine: "line-through",
  },
  groceryItemPrice: {
    fontSize: 14,
    color: themes.light.colors.text,
    fontWeight: "700",
  },

  // AI Tips
  aiTipsWrapper: {
    marginBottom: 24,
  },
  aiTipsCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: `${themes.light.colors.primary}20`,
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  aiGlowEffect: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${themes.light.colors.primary}10`,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 2,
  },
  aiIconWrapper: {
    backgroundColor: `${themes.light.colors.primary}15`,
    padding: 8,
    borderRadius: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: themes.light.colors.text,
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  aiList: {
    zIndex: 2,
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bulletIconContainer: {
    marginRight: 12,
    backgroundColor: themes.light.colors.surface,
    padding: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bulletText: {
    fontSize: 12,
    color: themes.light.colors.text,
    lineHeight: 16,
    flex: 1,
    fontWeight: "600",
  },
  bgDecoration: {
    position: "absolute",
    bottom: -20,
    right: -10,
    opacity: 0.05,
    transform: [{ rotate: "-15deg" }],
    zIndex: 0,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themes.light.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    height: 56,
    backgroundColor: themes.light.colors.surface,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: themes.light.colors.border,
  },
  secondaryButtonText: {
    color: themes.light.colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  primaryButton: {
    flex: 2,
    flexDirection: "row",
    height: 56,
    backgroundColor: themes.light.colors.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: themes.light.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: themes.light.colors.surface,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
