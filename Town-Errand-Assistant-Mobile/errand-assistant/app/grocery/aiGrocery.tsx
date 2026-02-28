import { themes } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';



// Types and Interfaces 
interface Category {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label?: string;
  color?: string;
  required: boolean;
}

interface Item {
  id: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
}

//DATA 

const ShoppingCategory: Category[] = [
  { id: 'groceries', name: 'Groceries', icon: 'basket', label: 'required', color: '#F2994A', required: true },
  { id: 'snacks', name: 'Snacks', icon: 'ice-cream', color: '#E17A47', required: false },
  { id: 'toiletries', name: 'Toiletries', icon: 'toothbrush-paste', color: '#4CAF50', required: false },
  { id: 'cleaning', name: 'Cleaning', icon: 'spray-bottle', color: '#03A9F4', required: false },
  { id: 'baby', name: 'Baby', icon: 'baby-carriage', color: '#E91E63', required: false },
  { id: 'pets', name: 'Pets', icon: 'paw', color: '#795548', required: false },
  { id: 'drinks', name: 'Drinks', icon: 'glass-flute', color: '#9C27B0', required: false },
];

const DietaryRestrictions: Item[] = [
  { id: 'none', label: 'None', icon: 'cancel', color: '#F2994A' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf', color: '#F2994A' },
  { id: 'nut-free', label: 'Nut-Free', icon: 'peanut-off', color: '#E91E63' },
  { id: 'vegan', label: 'Vegan', icon: 'leaf', color: '#E17A47' },
  { id: 'halal', label: 'Halal', icon: 'food-halal', color: '#4CAF50' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: 'barley-off', color: '#E91E63' },
  { id: 'kosher', label: 'Kosher', icon: 'food-kosher', color: '#03A9F4' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: 'cheese-off', color: '#795548' },
  { id: 'soy-free', label: 'Soy-Free', icon: 'seed', color: '#9C27B0' },
  { id: 'shellfish-free', label: 'Shellfish-Free', icon: 'fish-off', color: '#795548' },
  { id: 'egg-free', label: 'Egg-Free', icon: 'egg-off', color: '#9C27B0' },
];


export default function AiGroceryScreen() {

  const [budgetAmount, setBudgetAmount] = useState('');
  const [familySize, setFamilySize] = useState('');
  const [focusedInput, setFocusedInput] = useState<'budget' | 'family' | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleCategory = (id: string, required?: boolean) => {
    if (required) return; // Cannot unselect required items
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

    const toggleDietary = (id: string) => {
    setSelectedDietaryRestrictions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (

    <View style={styles.container}>
      <StatusBar barStyle={'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name='arrow-left' size={24} color={themes.light.colors.text} />
        </Pressable>
        <Text style={styles.title}>AI Grocery Assistant</Text>

        {/* Invisible spacer to perfectly center the title if needed, or just let it flex */}
        <View style={{ width: 24 }} />
        <Ionicons name='sparkles' size={24} color={themes.light.colors.primary} />

      </View>

      {/* Essential Content*/}
      <View style={styles.essentialContainer}>
        <Text style={styles.essentialTitle}>Essentials</Text>

        <View style={styles.essentialWrapper}>
          <View style={[styles.inputContainer, focusedInput === 'budget' && styles.inputContainerActive]}>
            <Ionicons
              name='wallet-outline'
              size={20}
              color={focusedInput === 'budget' ? themes.light.colors.primary : (themes.light.colors.textSecondary || '#666')}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Budget (R)"
              placeholderTextColor={themes.light.colors.textSecondary}
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              onFocus={() => setFocusedInput('budget')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={[styles.inputContainer, focusedInput === 'family' && styles.inputContainerActive]}>
            <Ionicons
              name="people-outline"
              size={20}
              color={focusedInput === 'family' ? themes.light.colors.primary : (themes.light.colors.textSecondary || '#666')}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Family Size"
              placeholderTextColor={themes.light.colors.textSecondary}
              keyboardType="numeric"
              value={familySize}
              onChangeText={setFamilySize}
              onFocus={() => setFocusedInput('family')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

      </View>

      {/*Shopping Category*/}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>Shopping Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>

          {(() => {
            const cat = ShoppingCategory[0]; // groceries
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id, cat.required)}
                style={[
                  styles.gridItem,
                  styles.gridItemLarge,
                  isSelected && styles.gridItemSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <View style={styles.gridIconContainer}>
                  <Text style={{ fontSize: 40 }}>🧺</Text>
                </View>
                <Text style={styles.gridLabel}>{cat.name}</Text>
                {cat.label && (
                  <Text style={styles.gridSubLabel}>{cat.label}</Text>
                )}
              </Pressable>
            );
          })()}

          {/* Other Categories - Grouped in columns of 2 */}
          {Array.from({ length: Math.ceil((ShoppingCategory.length - 1) / 2) }).map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={{ gap: 5 }}>
              {ShoppingCategory.slice(1 + colIndex * 2, 1 + colIndex * 2 + 2).map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id, cat.required)}
                    style={[
                      styles.gridItem,
                      isSelected && styles.gridItemSelected,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color='transparent' />
                      </View>
                    )}
                    <View style={styles.gridIconContainer}>
                      <MaterialCommunityIcons
                        name={cat.icon}
                        size={38}
                        color={isSelected ? cat.color : `${cat.color}99`} // Use category color directly (slightly transparent if not selected)
                      />
                    </View>
                    <Text style={styles.gridLabel}>{cat.name}</Text>
                    {cat.label && (
                      <Text style={styles.gridSubLabel}>{cat.label}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}


        </ScrollView>
      </View>

      {/*DIETRY*/}
      <View style={styles.diertyContainer}>
        <Text style={styles.diertyTitle}>Dietary Restrictions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {DietaryRestrictions.map((restriction) => {
            const isSelected = selectedDietaryRestrictions.includes(restriction.id);
            return (
              <Pressable
                key={restriction.id}
                onPress={() => toggleDietary(restriction.id)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                  {restriction.icon && (
                    <MaterialCommunityIcons
                      name={restriction.icon}
                      size={14}
                      color={isSelected ? restriction.color : `${restriction.color}99`} 
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextWhite : styles.chipTextDark,
                    ]}
                  >
                    {restriction.label}
                  </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/*Notes */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder='No spicey food , allegic to nuts ...'
          placeholderTextColor={themes.light.colors.textSecondary}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/*Submit Button*/}
      <View style={styles.submitContainer}> 
      <Pressable onPress={router.push('/grocery/aiResults')} style={styles.submitButton}
      >
              <Text style={styles.btnText}>Create List</Text>
              <MaterialCommunityIcons name="creation" size={20} color="#FFF" style={{ marginLeft: 8 }} />     
               </Pressable>
      </View>



    </View>

  );
}
const { width } = Dimensions.get('window');
const GRID_GAP = 10;
// Calculate roughly 3 columns minus padding
const ITEM_WIDTH = (width - 32 - 32 - (GRID_GAP * 2)) / 4;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: themes.light.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,

  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: themes.light.colors.text,
  },
  essentialContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  essentialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 12,
  },
  essentialWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputContainerActive: {
    borderColor: themes.light.colors.primary,
    backgroundColor: `${themes.light.colors.primary}10`,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: themes.light.colors.text,
    height: '100%',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 12,
  },
  gridItem: {
    width: ITEM_WIDTH + 5,
    height: ITEM_WIDTH + 5, // Make it square
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridItemLarge: {
    width: ITEM_WIDTH + 5, // Double width for the big one
    height: ITEM_WIDTH * 2 + GRID_GAP,
  },
  gridItemSelected: {
    borderColor: themes.light.colors.primary,
    backgroundColor: `${themes.light.colors.primary}10`,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themes.light.colors.text,
    textAlign: 'center',
  },
  gridSubLabel: {
    fontSize: 12,
    color: themes.light.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: themes.light.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipSelected: {
    borderColor: themes.light.colors.primary,
    backgroundColor: themes.light.colors.primary,
  },
  categoryChipFocused: {
    borderColor: themes.light.colors.primary,
    backgroundColor: themes.light.colors.primary,
  },
  diertyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  diertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  chipSelected: {
    borderColor: themes.light.colors.primary,
    backgroundColor: themes.light.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: themes.light.colors.text,
  },
  chipTextWhite: {
    color: '#FFF',
  },
  chipTextDark: {
    color: '#555',
  },
  notesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themes.light.colors.text,
    marginBottom: 5,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#F8F9FA',
    fontSize: 14,
    color: themes.light.colors.text,
    height: 100,
    textAlignVertical: 'top',
    minHeight: 100,
    maxHeight: 200,
    overflow: 'scroll',
    marginBottom: 10,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 5,
    shadowColor: themes.light.colors.primaryAlt,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 30,
    backgroundColor: themes.light.colors.primary,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    alignSelf: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});