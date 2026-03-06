import { GoogleGenAI } from "@google/genai";


type Schema = any;

type UserPreferences = {
  budget: string | number;
  familySize: string | number;
  mealType?: string;
  diet?: string[];
  categories?: string[];
  customRequest?: string;
  allergies?: string | string[];
};

type GroceryItem = { name: string; price: string };
type GroceryCategory = { category: string; items: GroceryItem[] };

export type MealBreakdown = {
  breakfast: string[];
  lunchbox: string[];
  dinners: string[];
  braai: string[];
};

export type CategoryTotal = {
  category: string;
  total: string;
};

export type GroceryListResponse = {
  budget: string;
  familySize: string;
  allergies: string;
  dietaryPreferences: string;
  mealFocus: string;
  selectedCategories: string[];
  recommendations: GroceryCategory[];
  mealBreakdown: MealBreakdown;
  estimatedTotal: string;
  categoryTotals: CategoryTotal[];
  aiTips: string[];
};

const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = 25_000;
const MAX_RETRIES = 3;

// Spend close to budget
const HARD_MIN_SPEND_RATIO = 0.8; // must be >= 80% when possible
const SOFT_MIN_SPEND_RATIO = 0.93; // if below this, run “increase” passes
const TARGET_SPEND_RATIO = 1.0; // aim 100% of budget (still <= budget)
const MAX_BUDGET_ADJUST_PASSES = 4;

// Turn on only while developing
const DEBUG = false;

export class GeminiService {
  static ai = new GoogleGenAI({
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
    httpOptions: { apiVersion: "v1alpha" },
  });

  static async generateGroceryList(
    userPreferences: UserPreferences,
    onProgress?: (message: string) => void
  ): Promise<GroceryListResponse> {
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY");
    }

    onProgress?.("Analyzing your preferences...");
    const prefs = this.normalizePreferences(userPreferences);

    // IMPORTANT: this is exactly what the user selected (plus Groceries if missing)
    const allowedCategories = this.getAllowedCategories(prefs);

    const schema = this.buildGroceryListSchema(allowedCategories);

    // 1) Generate
    onProgress?.("AI is planning your shopping list...");
    const prompt = this.buildPrompt(prefs, allowedCategories);
    const aiText = await this.generateWithRetry(prompt, { forceJson: true, schema });

    // 2) Parse/repair
    onProgress?.("Structuring the results...");
    let parsed = await this.parseOrRepair(aiText, prefs, schema, allowedCategories);

    // 3) Validate + normalize
    this.validateAIResponse(parsed);
    let normalized = this.normalizeAIResponse(parsed, prefs, allowedCategories);

    // 4) Fix missing/duplicate categories
    onProgress?.("Ensuring all categories are covered...");
    normalized = await this.ensureAllSelectedCategories(normalized, prefs, allowedCategories, schema);

    // 5) Ensure groceries are “complete” for the selected Meal Focus
    onProgress?.("Optimizing for your meal focus...");
    normalized = await this.ensureGroceriesEssentials(normalized, prefs, allowedCategories, schema);

    // 6) Align to budget (increase if far under, reduce if over)
    onProgress?.("Balancing with your budget...");
    normalized = await this.adjustToBudgetIfNeeded(prefs, normalized, allowedCategories, schema);

    // 7) Re-check groceries after budget changes (reduction sometimes removes essentials)
    normalized = await this.ensureGroceriesEssentials(normalized, prefs, allowedCategories, schema);

    // 8) Finalize derived fields (meal breakdown + totals) so UI always matches the final list
    normalized = this.finalizeDerivedFields(normalized, prefs, allowedCategories);

    onProgress?.("Finalizing your smart plan...");
    return normalized;
  }

  // ---------------------------
  // Schema (includes Meal Focus + selectedCategories + mealBreakdown)
  // ---------------------------
  private static buildGroceryListSchema(allowedCategories: string[]): Schema {
    return {
      type: "object",
      required: [
        "budget",
        "familySize",
        "allergies",
        "dietaryPreferences",
        "mealFocus",
        "selectedCategories",
        "recommendations",
        "mealBreakdown",
        "aiTips",
      ],
      properties: {
        budget: { type: "string" },
        familySize: { type: "string" },
        allergies: { type: "string" },
        dietaryPreferences: { type: "string" },

        mealFocus: { type: "string" },
        selectedCategories: {
          type: "array",
          items: { type: "string", enum: allowedCategories },
        },

        recommendations: {
          type: "array",
          items: {
            type: "object",
            required: ["category", "items"],
            properties: {
              category: { type: "string", enum: allowedCategories },
              items: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "price"],
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" }, // "R45"
                  },
                },
              },
            },
          },
        },

        // Meal breakdown should reference item names from recommendations (we also enforce this in normalization)
        mealBreakdown: {
          type: "object",
          required: ["breakfast", "lunchbox", "dinners", "braai"],
          properties: {
            breakfast: { type: "array", items: { type: "string" } },
            lunchbox: { type: "array", items: { type: "string" } },
            dinners: { type: "array", items: { type: "string" } },
            braai: { type: "array", items: { type: "string" } },
          },
        },

        aiTips: {
          type: "array",
          items: { type: "string" },
        },
      },
    };
  }

  // Ensures user-selected categories are what we enforce (and always includes Groceries)
  private static getAllowedCategories(prefs: Required<UserPreferences>): string[] {
    const raw = Array.isArray(prefs.categories) && prefs.categories.length ? prefs.categories : ["Groceries"];
    const cleaned = raw.map((c) => String(c).trim()).filter(Boolean);

    // Dedup case-insensitively, preserving first occurrence casing
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const c of cleaned) {
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(c);
    }

    const hasGroceries = deduped.some((c) => c.trim().toLowerCase() === "groceries");
    return hasGroceries ? deduped : ["Groceries", ...deduped];
  }

  // ---------------------------
  // Meal focus parsing (supports your chips: All Meals, Breakfast, Dinners, Lunchbox, Braai)
  // ---------------------------
  private static parseMealFocus(mealType: string) {
    const t = (mealType || "").toLowerCase();

    const allMeals =
      t.includes("all meals") || t.trim() === "" || (t.includes("all") && !t.includes("small"));

    const breakfast = t.includes("breakfast");
    const dinners = t.includes("dinners") || t.includes("dinner");
    const lunchbox = t.includes("lunchbox") || t.includes("lunch box");
    const braai = t.includes("braai");

    // If "All Meals" selected, treat as everything.
    if (allMeals) {
      return { allMeals: true, breakfast: true, dinners: true, lunchbox: true, braai: true };
    }

    // Otherwise use the specific selections (could be multiple)
    return {
      allMeals: false,
      breakfast,
      dinners,
      lunchbox,
      braai,
    };
  }

  private static getMinGroceriesItemCount(prefs: Required<UserPreferences>) {
    const family = Math.max(1, Math.floor(this.toNumber(prefs.familySize)));
    const flags = this.parseMealFocus(prefs.mealType);

    // Base depends on meal focus
    let base = 18;

    if (flags.allMeals) base = 28;
    else if (flags.breakfast && !flags.dinners && !flags.lunchbox && !flags.braai) base = 16;
    else if (flags.dinners && !flags.breakfast && !flags.lunchbox) base = 20;
    else if (flags.lunchbox && !flags.dinners && !flags.breakfast) base = 18;
    else if (flags.dinners && flags.lunchbox) base = 24;
    else if (flags.breakfast && flags.dinners) base = 24;

    // Scale with family size
    const extra = Math.max(0, family - 4) * 2;
    return Math.min(50, base + extra);
  }

  // ---------------------------
  // Budget adjustment
  // ---------------------------
  private static async adjustToBudgetIfNeeded(
    prefs: Required<UserPreferences>,
    current: GroceryListResponse,
    allowedCategories: string[],
    schema: Schema
  ): Promise<GroceryListResponse> {
    const budgetNum = this.toNumber(prefs.budget);
    if (budgetNum <= 0) return current;

    let result = current;

    for (let pass = 1; pass <= MAX_BUDGET_ADJUST_PASSES; pass++) {
      const total = this.sumEstimatedSpend(result);
      const hardMin = Math.round(budgetNum * HARD_MIN_SPEND_RATIO);
      const softMin = Math.round(budgetNum * SOFT_MIN_SPEND_RATIO);

      if (DEBUG) {
        console.log(`[Gemini] budget pass ${pass}: total=${total}, budget=${budgetNum}, softMin=${softMin}`);
      }

      // Over budget -> reduce
      if (total > budgetNum) {
        const reducePrompt = this.buildReducePrompt(prefs, result, budgetNum, allowedCategories);
        const reducedText = await this.generateWithRetry(reducePrompt, { forceJson: true, schema });
        const reducedParsed = await this.parseOrRepair(reducedText, prefs, schema, allowedCategories);

        this.validateAIResponse(reducedParsed);
        result = this.normalizeAIResponse(reducedParsed, prefs, allowedCategories);
        result = await this.ensureAllSelectedCategories(result, prefs, allowedCategories, schema);
        continue;
      }

      // Under budget -> increase
      if (total < softMin || total < hardMin) {
        const increasePrompt = this.buildIncreasePrompt(prefs, result, budgetNum, allowedCategories);
        const increasedText = await this.generateWithRetry(increasePrompt, { forceJson: true, schema });
        const increasedParsed = await this.parseOrRepair(increasedText, prefs, schema, allowedCategories);

        this.validateAIResponse(increasedParsed);
        result = this.normalizeAIResponse(increasedParsed, prefs, allowedCategories);
        result = await this.ensureAllSelectedCategories(result, prefs, allowedCategories, schema);
        continue;
      }

      // Good enough
      break;
    }

    return result;
  }

  // ---------------------------
  // Category coverage enforcement
  // ---------------------------
  private static async ensureAllSelectedCategories(
    normalized: GroceryListResponse,
    prefs: Required<UserPreferences>,
    allowedCategories: string[],
    schema: Schema
  ): Promise<GroceryListResponse> {
    const coverage = this.checkCategoryCoverage(normalized, allowedCategories);
    if (coverage.ok) return normalized;

    const fixPrompt = this.buildFixCategoriesPrompt(prefs, normalized, allowedCategories);
    const fixedText = await this.generateWithRetry(fixPrompt, { forceJson: true, schema });
    const fixedParsed = await this.parseOrRepair(fixedText, prefs, schema, allowedCategories);

    this.validateAIResponse(fixedParsed);
    const fixedNormalized = this.normalizeAIResponse(fixedParsed, prefs, allowedCategories);

    const coverage2 = this.checkCategoryCoverage(fixedNormalized, allowedCategories);
    if (!coverage2.ok) {
      throw new Error(
        `AI response did not include all selected categories: missing=${coverage2.missing.join(
          ", "
        )} duplicates=${coverage2.duplicates.join(", ")}`
      );
    }

    return fixedNormalized;
  }

  private static checkCategoryCoverage(resp: GroceryListResponse, allowedCategories: string[]) {
    const got = resp.recommendations.map((r) => r.category.toLowerCase());
    const expected = allowedCategories.map((c) => c.toLowerCase());

    const missing = expected.filter((c) => !got.includes(c));

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const c of got) {
      if (seen.has(c)) duplicates.push(c);
      seen.add(c);
    }

    return { ok: missing.length === 0 && duplicates.length === 0, missing, duplicates };
  }

  // ---------------------------
  // Groceries essentials enforcement (Meal Focus aware)
  // ---------------------------
  private static async ensureGroceriesEssentials(
    normalized: GroceryListResponse,
    prefs: Required<UserPreferences>,
    allowedCategories: string[],
    schema: Schema
  ): Promise<GroceryListResponse> {
    const groceriesSelected = allowedCategories.some((c) => c.toLowerCase() === "groceries");
    if (!groceriesSelected) return normalized;

    const check = this.checkGroceriesEssentials(normalized, prefs);
    if (check.ok) return normalized;

    const budgetNum = this.toNumber(prefs.budget);
    if (DEBUG) console.log("[Gemini] groceries essentials missing:", check);

    const fixPrompt = this.buildFixGroceriesPrompt(
      prefs,
      normalized,
      allowedCategories,
      budgetNum,
      check.missingGroups,
      check.issues
    );

    const fixedText = await this.generateWithRetry(fixPrompt, { forceJson: true, schema });
    const fixedParsed = await this.parseOrRepair(fixedText, prefs, schema, allowedCategories);

    this.validateAIResponse(fixedParsed);
    return this.normalizeAIResponse(fixedParsed, prefs, allowedCategories);
  }

  private static checkGroceriesEssentials(resp: GroceryListResponse, prefs: Required<UserPreferences>) {
    const groceries = resp.recommendations.find((r) => r.category.toLowerCase() === "groceries");
    if (!groceries) {
      return { ok: false, missingGroups: ["groceries"], issues: ["missingGroceriesCategory"] as string[] };
    }

    const items = groceries.items.map((i) => i.name.toLowerCase());
    const itemCount = groceries.items.length;

    const flags = this.parseMealFocus(prefs.mealType);
    const minCount = this.getMinGroceriesItemCount(prefs);

    const diet = (prefs.diet || []).map((d) => d.toLowerCase());
    const vegan = diet.includes("vegan");
    const vegetarian = diet.includes("vegetarian");

    const hasAny = (keywords: string[]) => keywords.some((k) => items.some((name) => name.includes(k)));

    // Proteins (diet-aware)
    const proteinKeywords = vegan
      ? ['beans', 'lentils', 'chickpeas', 'tofu', 'soya', 'soy', 'soya mince', 'tvp', 'tempeh']
      : vegetarian
        ? ['eggs', 'beans', 'lentils', 'chickpeas', 'tofu', 'soya', 'cheese', 'yoghurt', 'yogurt']
        : ['chicken', 'beef', 'mince', 'steak', 'chops', 'boerewors', 'fish', 'hake', 'tuna', 'sardines', 'eggs', 'beans', 'lentils'];

    const vegKeywords = [
      'potato',
      'onion',
      'tomato',
      'carrot',
      'spinach',
      'cabbage',
      'pepper',
      'lettuce',
      'mixed veg',
      'butternut',
      'broccoli',
    ];
    const fruitKeywords = ['banana', 'apple', 'orange', 'pear', 'grapes', 'naartjie', 'fruit'];
    const dairyKeywords = vegan
      ? ['soya milk', 'soy milk', 'oat milk', 'almond milk', 'plant yoghurt', 'dairy-free yoghurt', 'margarine']
      : ['milk', 'yoghurt', 'yogurt', 'cheese', 'butter'];
    const starchKeywords = ['rice', 'pasta', 'bread', 'maize meal', 'pap', 'potato', 'wrap', 'rolls', 'flour'];
    const cookingKeywords = ['cooking oil', 'oil', 'salt', 'spice', 'stock', 'stock cubes', 'garlic', 'ginger', 'curry', 'bbq', 'tomato paste'];

    // Meal-focus specific keywords
    const breakfastKeywords = vegan
      ? ['oats', 'cereal', 'muesli', 'granola', 'oat milk', 'soy milk', 'soya milk', 'bread', 'fruit', 'jam']
      : ['oats', 'cereal', 'muesli', 'granola', 'milk', 'eggs', 'bread', 'yoghurt', 'yogurt', 'fruit', 'jam', 'peanut butter'];

    const lunchboxKeywords = [
      'bread',
      'wrap',
      'roll',
      'peanut butter',
      'jam',
      'cheese',
      'polony',
      'ham',
      'tuna',
      'mayo',
      'yoghurt',
      'yogurt',
      'fruit',
      'snack',
      'crackers',
    ];

    const braaiKeywords = vegan
      ? ['braai spice', 'bbq spice', 'mushroom', 'veg sosatie', 'halloumi', 'veggie burger', 'firelighter', 'charcoal']
      : ['braai spice', 'bbq spice', 'boerewors', 'chops', 'steak', 'chicken', 'firelighter', 'charcoal'];

    const missingGroups: string[] = [];
    const issues: string[] = [];

    // Always require these for groceries
    if (!hasAny(proteinKeywords)) missingGroups.push('protein');
    if (!hasAny(vegKeywords)) missingGroups.push('vegetables');
    if (!hasAny(fruitKeywords)) missingGroups.push('fruit');
    if (!hasAny(cookingKeywords)) missingGroups.push('cookingEssentials');
    if (!hasAny(starchKeywords)) missingGroups.push('starches');

    // Dairy only if not explicitly dairy-free etc.
    const dairyFree = diet.some((d) => d.includes('dairy-free'));
    if (!dairyFree && !hasAny(dairyKeywords)) missingGroups.push(vegan ? 'dairyAlternatives' : 'dairy');

    // Meal focus requirements
    if (flags.breakfast && !hasAny(breakfastKeywords)) missingGroups.push('breakfastBasics');
    if (flags.lunchbox && !hasAny(lunchboxKeywords)) missingGroups.push('lunchboxBasics');
    if (flags.braai && !hasAny(braaiKeywords)) missingGroups.push('braaiEssentials');

    if (itemCount < minCount) issues.push(`tooFewItems(${itemCount}<${minCount})`);

    const bulkIssue = this.detectUnrealisticBulk(groceries.items, this.toNumber(prefs.familySize));
    if (bulkIssue) issues.push(bulkIssue);

    return { ok: missingGroups.length === 0 && issues.length === 0, missingGroups, issues };
  }

  private static detectUnrealisticBulk(items: GroceryItem[], familySizeNum: number): string | null {
    const maxKg = familySizeNum >= 10 ? 25 : 15; // 7-day plan: keep reasonable
    const maxL = familySizeNum >= 10 ? 20 : 12;

    for (const it of items) {
      const name = it.name.toLowerCase();

      const kgMatch = name.match(/(\d+(?:\.\d+)?)\s*kg/);
      if (kgMatch) {
        const kg = Number(kgMatch[1]);
        if (Number.isFinite(kg) && kg > maxKg) return `unrealisticBulkKg(${kg}kg)`;
      }

      const lMatch = name.match(/(\d+(?:\.\d+)?)\s*l\b/);
      if (lMatch) {
        const l = Number(lMatch[1]);
        if (Number.isFinite(l) && l > maxL) return `unrealisticBulkL(${l}L)`;
      }
    }
    return null;
  }

  // ---------------------------
  // Prompts (Meal Focus + selected categories are enforced)
  // ---------------------------
  static buildPrompt(preferences: Required<UserPreferences>, allowedCategories: string[]): string {
    const dietInstructions = this.getDietaryInstructions(preferences.diet);
    const flags = this.parseMealFocus(preferences.mealType);

    const allergyText = Array.isArray(preferences.allergies)
      ? preferences.allergies.join(', ')
      : preferences.allergies;

    const allergyInstructions =
      allergyText && allergyText !== 'None'
        ? `STRICTLY AVOID: ${allergyText}. Do not include any items containing these allergens.`
        : 'No specific allergen restrictions.';

    const requestLine = preferences.customRequest?.trim()
      ? `SPECIAL NOTES FROM USER: ${preferences.customRequest.trim()}`
      : 'SPECIAL NOTES FROM USER: None';

    const categoriesLine = allowedCategories.join(', ');

    const budgetNum = this.toNumber(preferences.budget);
    const targetSpend = Math.round(budgetNum * TARGET_SPEND_RATIO);
    const softMinSpend = Math.round(budgetNum * SOFT_MIN_SPEND_RATIO);
    const hardMinSpend = Math.round(budgetNum * HARD_MIN_SPEND_RATIO);

    const minGroceriesCount = this.getMinGroceriesItemCount(preferences);

    const mealFocusRules = `
MEAL FOCUS (VERY IMPORTANT):
User selected: '${preferences.mealType}'

- If includes 'Breakfast': include breakfast staples (oats/cereal, milk or alternatives, eggs if allowed, bread, fruit, yoghurt if allowed).
- If includes 'Dinners': prioritize dinner proteins + veg + starch + sauces/spices for 30 dinners.
- If includes 'Lunchbox': include lunchbox-friendly items (bread/wraps, sandwich fillings, fruit, yoghurt, easy snacks).
- If includes 'Braai': include braai-appropriate proteins (or vegetarian alternatives), braai spice, and braai essentials
  like charcoal/firelighters IF possible (place them under 'Groceries' since categories are limited).
- If 'All Meals': include breakfast + lunchbox basics + dinner ingredients for 30 days.
`.trim();

    return `
You are a helpful South African budget shopping assistant.

Create a 30-DAY shopping list for the family.

FAMILY DETAILS:
- Budget: R${preferences.budget}
- Family Size: ${preferences.familySize} people
- Meal Focus: ${preferences.mealType}
- Dietary Preferences: ${preferences.diet.join(', ')}
- Selected categories (MUST match exactly): ${categoriesLine}
- Allergies/Restrictions: ${allergyText || 'None'}
- ${requestLine}

BUDGET UTILIZATION (CRITICAL):
- Total must be <= R${budgetNum}
- Aim close to budget: target around R${targetSpend}
- Do NOT underspend heavily: ideally >= R${softMinSpend}
- MUST NOT be less than R${hardMinSpend} unless truly impossible.
- Use the budget by adding meaningful groceries (not only 1 huge bulk item).

${mealFocusRules}

GROCERIES COMPLETENESS (CRITICAL if "Groceries" selected):
- "Groceries" must be a balanced weekly basket for ${preferences.familySize} people (30 days).
- Must include: proteins + vegetables + fruit + starches + cooking essentials.
- Must include at least ~${minGroceriesCount} grocery items (variety).
- Avoid unrealistic bulk for 30 days (do NOT output 50kg maize meal). Use reasonable pack sizes and add variety instead.
${flags.breakfast ? `- Because "Breakfast" is selected, ensure breakfast staples are included.` : ''} 
${flags.lunchbox ? `- Because "Lunchbox" is selected, ensure lunchbox basics are included.` : ''}
${flags.braai ? `- Because "Braai" is selected, include braai-style items (protein + braai spice + charcoal/firelighters if possible).` : ''}

DIETARY REQUIREMENTS:
${dietInstructions}

ALLERGY REQUIREMENTS:
${allergyInstructions}

CATEGORY RULES (STRICT):
- recommendations MUST include EVERY category listed in 'Selected categories' below.
- Each category name must appear EXACTLY once.
- Do NOT skip any category even if the items are few.
- Items must match their category (e.g. toiletries under Toiletries, snacks under Snacks, etc.)

MEAL BREAKDOWN RULES (FOR DISPLAY):
- You MUST return "mealBreakdown" with keys: breakfast, lunchbox, dinners, braai.
- Each array must contain ITEM NAMES copied EXACTLY from the "recommendations" items (no new items).
- If a focus is NOT selected (e.g. user did not choose Braai), keep that array empty.
- If "All Meals" is selected, fill all relevant arrays (breakfast, lunchbox, dinners, braai) as appropriate.

PRICING RULES:
- Use realistic SA supermarket pricing (Checkers, Pick n Pay, Shoprite).
- Each item name must include size/quantity (e.g., "Chicken portions 5kg", "Milk 6 x 2L", "Apples 2kg").
- Price is TOTAL for the item, format "R<number>".
- Avoid duplicates.

OUTPUT RULE:
Return ONLY valid JSON (no markdown, no commentary) matching EXACTLY this shape:

{
  "budget": "R ${preferences.budget}",
  "familySize": "${preferences.familySize}",
  "allergies": "${allergyText || "None"}",
  "dietaryPreferences": "${preferences.diet.join(", ")}",
  "mealFocus": "${preferences.mealType}",
  "selectedCategories": [${allowedCategories.map((c) => `"${c}"`).join(", ")}],
  "recommendations": [
    {
      "category": "${allowedCategories[0]}",
      "items": [
        {"name": "Item 1 with quantity/size", "price": "R45"},
        {"name": "Item 2 with quantity/size", "price": "R60"}
      ]
    },
    {
      "category": "${allowedCategories[1] || "Other Category"}",
      "items": [
        {"name": "Example item from second category", "price": "R30"}
      ]
    }
  ],
  "mealBreakdown": {
    "breakfast": ["Item 1 with quantity/size"],
    "lunchbox": [],
    "dinners": ["Item 2 with quantity/size"],
    "braai": []
  },
  "aiTips": ["Tip 1", "Tip 2"]
}

FATAL ERROR IF CATEGORIES MISSING: Do not group everything into "Groceries". Use the specific categories selected by the user.
`.trim();
  }

  private static buildFixCategoriesPrompt(
    prefs: Required<UserPreferences>,
    current: GroceryListResponse,
    allowedCategories: string[]
  ): string {
    const budgetNum = this.toNumber(prefs.budget);
    const target = Math.round(budgetNum * TARGET_SPEND_RATIO);

    return `
Fix the JSON so "recommendations" has EXACTLY these categories, each appearing once:
${allowedCategories.join(", ")}

Rules:
- You MUST include every single category listed above in "recommendations".
- Keep the SAME JSON SHAPE and KEEP all top-level keys.
- Keep within budget R${budgetNum} and close to budget (aim ~R${target}).
- Do not rename categories. Do not add extra categories.
- Respect Meal Focus: "${prefs.mealType}".
- Keep mealBreakdown item names copied from recommendations items (no new items).

Return JSON ONLY.

CURRENT JSON:
${JSON.stringify(current)}
`.trim();
  }

  private static buildFixGroceriesPrompt(
    prefs: Required<UserPreferences>,
    current: GroceryListResponse,
    allowedCategories: string[],
    budgetNum: number,
    missingGroups: string[],
    issues: string[]
  ): string {
    const target = Math.round(budgetNum * TARGET_SPEND_RATIO);
    const softMin = Math.round(budgetNum * SOFT_MIN_SPEND_RATIO);
    const minGroceriesCount = this.getMinGroceriesItemCount(prefs);

    return `
The list is missing important "Groceries" essentials or lacks variety.

MISSING/ISSUES:
- Missing groups: ${missingGroups.join(", ") || "none"}
- Issues: ${issues.join(", ") || "none"}

TASK:
- Improve "Groceries" to be a complete 7-day basket for a family of ${prefs.familySize}.
- YOU MUST STILL INCLUDE ALL CATEGORIES: ${allowedCategories.join(", ")} (each exactly once) in "recommendations".
- Keep the SAME JSON SHAPE and return JSON ONLY.
- Keep all top-level keys (including mealFocus, selectedCategories, mealBreakdown).
- Meal Focus is: "${prefs.mealType}" (ensure groceries align with it).
- "Groceries" must include proteins + vegetables + fruit + starches + cooking essentials.
- "Groceries" should include at least ~${minGroceriesCount} items (variety).
- Avoid unrealistic bulk sizes (do not use 50kg bags for a 7-day plan). Use reasonable pack sizes and add variety.
- Keep within budget R${budgetNum} and spend close to budget (aim ~R${target}, ideally >= R${softMin}).
- MealBreakdown arrays must contain item names copied from recommendations only.

Return JSON ONLY.

CURRENT JSON:
${JSON.stringify(current)}
`.trim();
  }

  private static buildReducePrompt(
    prefs: Required<UserPreferences>,
    current: GroceryListResponse,
    budgetNum: number,
    allowedCategories: string[]
  ): string {
    const target = Math.round(budgetNum * TARGET_SPEND_RATIO);

    return `
The list exceeds the budget.

TASK:
- Reduce total to <= R${budgetNum}
- Keep totals close to budget (aim ~R${target}, not far below).
- MUST KEEP ALL CATEGORIES EXACTLY (each once): ${allowedCategories.join(", ")}
- Do NOT remove any selected category entirely.
- IMPORTANT: Do not remove core groceries like proteins, vegetables, fruit, starches, cooking essentials.
- Respect Meal Focus: "${prefs.mealType}".
- Keep mealBreakdown consistent: it must reference existing recommendation item names only.
- Return JSON ONLY with same shape and all top-level keys kept.

CURRENT JSON:
${JSON.stringify(current)}
`.trim();
  }

  private static buildIncreasePrompt(
    prefs: Required<UserPreferences>,
    current: GroceryListResponse,
    budgetNum: number,
    allowedCategories: string[]
  ): string {
    const hardMin = Math.round(budgetNum * HARD_MIN_SPEND_RATIO);
    const softMin = Math.round(budgetNum * SOFT_MIN_SPEND_RATIO);
    const target = Math.round(budgetNum * TARGET_SPEND_RATIO);
    const remaining = Math.max(0, budgetNum - this.sumEstimatedSpend(current));
    const minGroceriesCount = this.getMinGroceriesItemCount(prefs);

    return `
The list is under-spending the budget.

CURRENT SPEND:
- Budget: R${budgetNum}
- Current estimated total: R${this.sumEstimatedSpend(current)}
- Remaining budget: ~R${remaining}

TASK:
- Increase items/quantities so total is <= R${budgetNum} but close to budget (aim ~R${target}).
- MUST KEEP ALL CATEGORIES EXACTLY (each once): ${allowedCategories.join(", ")}
- DO NOT REMOVE ANY CATEGORY.
- Ideally total >= R${softMin}. MUST NOT be less than R${hardMin} unless truly impossible.

IMPORTANT QUALITY RULES:
- Respect Meal Focus: "${prefs.mealType}" (add items that match the meal focus).
- Prioritize making "Groceries" a complete 7-day basket (proteins, vegetables, fruit, starches, cooking essentials).
- "Groceries" should have at least ~${minGroceriesCount} items (variety).
- Add meaningful extras aligned to selected Meal Focus (breakfast staples, lunchbox basics, dinner ingredients, braai essentials, etc.).
- Avoid unrealistic bulk like 50kg maize meal for 7 days. Use reasonable pack sizes and add variety instead.
- No duplicates. Each item has size/quantity. Price is total, "R<number>".
- Keep mealBreakdown consistent: it must reference existing recommendation item names only.

Return JSON ONLY.

CURRENT JSON:
${JSON.stringify(current)}
`.trim();
  }

  // ---------------------------
  // Dietary instructions
  // ---------------------------
  static getDietaryInstructions(dietPreferences: string[]): string {
    const normalized = dietPreferences.map((d) => d.trim().toLowerCase());
    const has = (x: string) => normalized.includes(x.toLowerCase());

    const instructions: string[] = [];
    const noRestrictions = has("standard") || has("none") || has("no restrictions");

    if (has("vegetarian")) {
      instructions.push("- NO meat, poultry, fish, or seafood");
      instructions.push("- Include eggs/dairy and plant proteins (beans, lentils, tofu)");
    }

    if (has("vegan")) {
      instructions.push("- STRICTLY NO animal products: meat, fish, dairy, eggs, honey");
      instructions.push("- Focus on plant proteins, grains, legumes (no nuts if allergic)");
    }

    if (has("halal")) {
      instructions.push("- Only include Halal-certified meat/poultry");
      instructions.push("- No pork or alcohol-containing ingredients");
    }

    if (has("gluten free") || has("gluten-free") || has("glutenfree")) {
      instructions.push("- NO wheat, barley, rye, or gluten-containing grains");
      instructions.push("- Use rice, quinoa, corn, gluten-free oats/breads");
    }

    if (noRestrictions && instructions.length === 0) {
      instructions.push("- Balanced diet with variety of foods");
    }

    return instructions.length ? instructions.join("\n") : "- Balanced diet with variety of foods";
  }

  // ---------------------------
  // Gemini call (retry/timeout)
  // ---------------------------
  private static async generateWithRetry(
    prompt: string,
    opts: { forceJson: boolean; schema?: Schema }
  ): Promise<string> {
    let lastErr: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.withTimeout(this.callGemini(prompt, opts), TIMEOUT_MS);
      } catch (err: any) {
        lastErr = err;

        const msg = String(err?.message || err);
        const isRetryable =
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("503") ||
          msg.includes("500") ||
          msg.includes("timeout");

        if (DEBUG) console.log(`[Gemini] attempt ${attempt} failed`, msg);

        if (!isRetryable || attempt === MAX_RETRIES) break;
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt - 1)));
      }
    }

    throw new Error(`AI request failed after retries: ${lastErr?.message || lastErr}`);
  }

  private static async callGemini(prompt: string, opts: { forceJson: boolean; schema?: Schema }): Promise<string> {
    const config: any = {
      temperature: 0.2,
      maxOutputTokens: 8000,
    };

    if (opts.forceJson) {
      config.responseMimeType = "application/json";
      if (opts.schema) config.responseSchema = opts.schema;
    }

    const response: any = await this.ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config,
    });

    const text = typeof response?.text === "function" ? response.text() : response?.text;
    if (!text || typeof text !== "string") throw new Error("Empty/invalid text returned from Gemini");

    if (DEBUG) console.log("[Gemini] raw response:", text);
    return text;
  }

  private static async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), ms);
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(t);
          reject(e);
        });
    });
  }

  // ---------------------------
  // Parsing + repair
  // ---------------------------
  private static async parseOrRepair(
    aiText: string,
    prefs: Required<UserPreferences>,
    schema: Schema,
    allowedCategories: string[]
  ) {
    const direct = this.tryParseJson(aiText);
    if (direct) return direct;

    const extracted = this.extractFirstJsonObject(aiText);
    const extractedParsed = extracted ? this.tryParseJson(extracted) : null;
    if (extractedParsed) return extractedParsed;

    const allergyText = Array.isArray(prefs.allergies) ? prefs.allergies.join(", ") : prefs.allergies;

    const repairPrompt = `
Fix into STRICTLY valid JSON (no markdown, no extra text). Same shape:

{
  "budget": "R ${prefs.budget}",
  "familySize": "${prefs.familySize}",
  "allergies": "${allergyText || "None"}",
  "dietaryPreferences": "${prefs.diet.join(", ")}",
  "mealFocus": "${prefs.mealType}",
  "selectedCategories": [${allowedCategories.map((c) => `"${c}"`).join(", ")}],
  "recommendations": [
    {
      "category": "${allowedCategories[0]}",
      "items": [{"name":"Item from first category", "price":"R45"}]
    },
    {
      "category": "${allowedCategories[1] || "Other Category"}",
      "items": [{"name":"Item from second category", "price":"R30"}]
    }
  ],
  "mealBreakdown": {"breakfast":[], "lunchbox":[], "dinners":[], "braai":[]},
  "aiTips": ["...", "..."]
}

BROKEN INPUT:
${aiText}
`.trim();

    const repairedText = await this.generateWithRetry(repairPrompt, { forceJson: true, schema });

    const repaired =
      this.tryParseJson(repairedText) ||
      this.tryParseJson(this.extractFirstJsonObject(repairedText) || "");

    if (!repaired) throw new Error("Could not parse or repair AI JSON response");
    return repaired;
  }

  private static tryParseJson(text: string) {
    try {
      if (!text || typeof text !== "string") return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private static extractFirstJsonObject(text: string): string | null {
    if (!text) return null;
    const start = text.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
    return null;
  }

  // ---------------------------
  // Validation + normalization
  // ---------------------------
  static validateAIResponse(parsedData: any) {
    if (!parsedData || typeof parsedData !== "object") throw new Error("AI response is not an object");
    if (!parsedData.budget) throw new Error("AI response missing budget");
    if (!parsedData.familySize) throw new Error("AI response missing familySize");

    if (!Array.isArray(parsedData.recommendations) || parsedData.recommendations.length === 0) {
      throw new Error("AI response missing recommendations array");
    }

    for (const cat of parsedData.recommendations) {
      if (!cat?.category || !Array.isArray(cat.items) || cat.items.length === 0) {
        throw new Error("Invalid category structure in AI response");
      }
      for (const item of cat.items) {
        if (!item?.name || !item?.price) throw new Error("Invalid item structure in AI response");
      }
    }
  }

  private static normalizeAIResponse(
    parsed: any,
    prefs: Required<UserPreferences>,
    allowedCategories: string[]
  ): GroceryListResponse {
    const categoryMap = new Map<string, string>();
    for (const c of allowedCategories) categoryMap.set(c.toLowerCase(), c);

    const allergyText = Array.isArray(prefs.allergies) ? prefs.allergies.join(", ") : prefs.allergies;

    // Normalize core fields
    const budget = String(parsed.budget || `R ${prefs.budget}`);
    const familySize = String(parsed.familySize || prefs.familySize);
    const allergies = String(parsed.allergies || allergyText || "None");
    const dietaryPreferences = String(parsed.dietaryPreferences || prefs.diet.join(", "));

    // Force mealFocus + selectedCategories to match prefs/allowedCategories for reliable UI
    const mealFocus = String(parsed.mealFocus || prefs.mealType || "All Meals");
    const selectedCategories = [...allowedCategories];

    // Normalize recommendations
    const recsRaw = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const recs = recsRaw
      .map((cat: any) => {
        const rawName = String(cat?.category || "").trim();
        const coerced = categoryMap.get(rawName.toLowerCase()) || rawName; // try to match allowed casing
        return {
          category: coerced,
          items: Array.isArray(cat?.items) ? cat.items : [],
        };
      })
      .filter((cat: any) => cat.category && cat.items.length);

    // Clean items + de-dup within category
    for (const cat of recs) {
      cat.items = cat.items
        .filter((i: any) => i?.name && i?.price)
        .map((i: any) => ({
          name: this.cleanItemName(String(i.name)),
          price: this.normalizePrice(String(i.price)),
        }))
        .filter((i: GroceryItem) => i.name.length > 0 && i.price !== "R0");

      const seen = new Set<string>();
      cat.items = cat.items.filter((it: GroceryItem) => {
        const key = it.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Filter + sort categories to exactly allowedCategories order
    const allowedSet = new Set(allowedCategories.map((c) => c.toLowerCase()));
    const filtered = recs.filter((c: any) => allowedSet.has(String(c.category).toLowerCase()));

    const orderIndex = new Map<string, number>();
    allowedCategories.forEach((c, idx) => orderIndex.set(c.toLowerCase(), idx));
    filtered.sort((a: any, b: any) => {
      const ia = orderIndex.get(String(a.category).toLowerCase()) ?? 999;
      const ib = orderIndex.get(String(b.category).toLowerCase()) ?? 999;
      return ia - ib;
    });

    const tips = Array.isArray(parsed.aiTips)
      ? parsed.aiTips.map((t: any) => String(t).trim()).filter(Boolean)
      : [];
    const aiTips = tips.length
      ? tips
      : ["Compare unit prices and choose house brands where possible.", "Buy seasonal fruit and veg to save money."];

    // Meal breakdown: keep only item names that exist in recommendations; otherwise build it ourselves
    const normalizedResp: GroceryListResponse = {
      budget,
      familySize,
      allergies,
      dietaryPreferences,
      mealFocus,
      selectedCategories,
      recommendations: filtered,
      mealBreakdown: {
        breakfast: [],
        lunchbox: [],
        dinners: [],
        braai: [],
      },
      estimatedTotal: "R0",
      categoryTotals: [],
      aiTips,
    };

    // Fill mealBreakdown using model output if valid; then ensure it matches final recommendations
    normalizedResp.mealBreakdown = this.normalizeMealBreakdown(parsed?.mealBreakdown, normalizedResp, prefs);

    // Totals are always computed from recommendations for correctness
    return this.finalizeDerivedFields(normalizedResp, prefs, allowedCategories);
  }

  private static cleanItemName(name: string): string {
    return name.replace(/\s+/g, " ").replace(/^[\-\*\d\.\)\(]+\s*/g, "").trim();
  }

  private static normalizePrice(price: string): string {
    const cleaned = price.replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return "R0";
    return `R${Math.round(n)}`;
  }

  private static sumEstimatedSpend(resp: GroceryListResponse): number {
    let total = 0;
    for (const cat of resp.recommendations) {
      for (const item of cat.items) {
        total += Number(String(item.price).replace(/[^\d.]/g, "")) || 0;
      }
    }
    return total;
  }

  private static toNumber(value: string | number): number {
    const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  private static normalizePreferences(p: UserPreferences): Required<UserPreferences> {
    const budget = String(p.budget ?? "").replace(/[^\d.]/g, "");
    const familySize = String(p.familySize ?? "").replace(/[^\d]/g, "");

    const diet = Array.isArray(p.diet) && p.diet.length ? p.diet : ["None"];

    return {
      budget: budget || "0",
      familySize: familySize || "0",
      mealType: p.mealType && String(p.mealType).trim() ? String(p.mealType).trim() : "All Meals",
      diet,
      categories: Array.isArray(p.categories) && p.categories.length ? p.categories : ["Groceries"],
      customRequest: p.customRequest || "",
      allergies: p.allergies
        ? Array.isArray(p.allergies)
          ? p.allergies
          : String(p.allergies)
        : "None",
    };
  }

  // ---------------------------
  // Meal breakdown helpers (for better UI display)
  // ---------------------------
  private static normalizeMealBreakdown(
    raw: any,
    resp: GroceryListResponse,
    prefs: Required<UserPreferences>
  ): MealBreakdown {
    const flags = this.parseMealFocus(prefs.mealType);

    // All item names available in final recommendations
    const allItems = resp.recommendations.flatMap((c) => c.items.map((i) => i.name));
    const allSet = new Map<string, string>(); // lower -> original
    for (const n of allItems) allSet.set(n.toLowerCase(), n);

    const cleanList = (arr: any): string[] => {
      if (!Array.isArray(arr)) return [];
      const out: string[] = [];
      const seen = new Set<string>();
      for (const x of arr) {
        const s = this.cleanItemName(String(x || "")).trim();
        if (!s) continue;

        // Keep only if it exists in recommendations (case-insensitive)
        const canonical = allSet.get(s.toLowerCase());
        if (!canonical) continue;

        const key = canonical.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(canonical);
      }
      return out;
    };

    let breakfast = cleanList(raw?.breakfast);
    let lunchbox = cleanList(raw?.lunchbox);
    let dinners = cleanList(raw?.dinners);
    let braai = cleanList(raw?.braai);

    // If model didn't give anything useful, build from the recommendations using keywords
    const built = this.buildMealBreakdownFromRecommendations(resp, prefs);

    const shouldHaveBreakfast = flags.breakfast || flags.allMeals;
    const shouldHaveLunchbox = flags.lunchbox || flags.allMeals;
    const shouldHaveDinners = flags.dinners || flags.allMeals;
    const shouldHaveBraai = flags.braai || flags.allMeals;

    if (shouldHaveBreakfast && breakfast.length === 0) breakfast = built.breakfast;
    if (shouldHaveLunchbox && lunchbox.length === 0) lunchbox = built.lunchbox;
    if (shouldHaveDinners && dinners.length === 0) dinners = built.dinners;
    if (shouldHaveBraai && braai.length === 0) braai = built.braai;

    // If focus not selected, force empty (so UI can rely on it)
    if (!shouldHaveBreakfast) breakfast = [];
    if (!shouldHaveLunchbox) lunchbox = [];
    if (!shouldHaveDinners) dinners = [];
    if (!shouldHaveBraai) braai = [];

    return { breakfast, lunchbox, dinners, braai };
  }

  private static buildMealBreakdownFromRecommendations(
    resp: GroceryListResponse,
    prefs: Required<UserPreferences>
  ): MealBreakdown {
    const flags = this.parseMealFocus(prefs.mealType);
    const diet = (prefs.diet || []).map((d) => d.toLowerCase());
    const vegan = diet.includes("vegan");

    const allItems = resp.recommendations.flatMap((c) => c.items.map((i) => i.name));
    const lowerItems = allItems.map((n) => ({ raw: n, lower: n.toLowerCase() }));

    const pickByKeywords = (keywords: string[], limit: number) => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const it of lowerItems) {
        if (out.length >= limit) break;
        if (!keywords.some((k) => it.lower.includes(k))) continue;
        const key = it.lower;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(it.raw);
      }
      return out;
    };

    const breakfastKeywords = vegan
      ? ['oats', 'cereal', 'muesli', 'granola', 'oat milk', 'soy milk', 'soya milk', 'bread', 'fruit', 'jam']
      : ['oats', 'cereal', 'muesli', 'granola', 'milk', 'eggs', 'bread', 'yoghurt', 'yogurt', 'fruit', 'jam', 'peanut butter'];

    const lunchboxKeywords = ['bread', 'wrap', 'roll', 'jam', 'peanut butter', 'cheese', 'tuna', 'ham', 'polony', 'mayo', 'yoghurt', 'yogurt', 'fruit', 'snack', 'crackers'];

    const dinnersKeywords = vegan
      ? ['tofu', 'lentils', 'beans', 'chickpeas', 'rice', 'pasta', 'tomato', 'onion', 'garlic', 'mixed veg', 'potato']
      : ['chicken', 'beef', 'mince', 'fish', 'rice', 'pasta', 'tomato', 'onion', 'garlic', 'mixed veg', 'potato'];

    const braaiKeywords = vegan
      ? ['braai', 'bbq', 'charcoal', 'firelighter', 'mushroom', 'halloumi', 'veggie burger', 'sosatie']
      : ['braai', 'bbq', 'charcoal', 'firelighter', 'boerewors', 'chops', 'steak', 'chicken'];

    return {
      breakfast: flags.breakfast || flags.allMeals ? pickByKeywords(breakfastKeywords, 10) : [],
      lunchbox: flags.lunchbox || flags.allMeals ? pickByKeywords(lunchboxKeywords, 12) : [],
      dinners: flags.dinners || flags.allMeals ? pickByKeywords(dinnersKeywords, 14) : [],
      braai: flags.braai || flags.allMeals ? pickByKeywords(braaiKeywords, 10) : [],
    };
  }

  // ---------------------------
  // Final derived fields (totals + meal breakdown reconciliation)
  // ---------------------------
  private static finalizeDerivedFields(
    resp: GroceryListResponse,
    prefs: Required<UserPreferences>,
    allowedCategories: string[]
  ): GroceryListResponse {
    // Always force selectedCategories to allowed list (what user selected)
    resp.selectedCategories = [...allowedCategories];
    resp.mealFocus = resp.mealFocus || prefs.mealType || "All Meals";

    // Ensure meal breakdown only references items in recommendations
    resp.mealBreakdown = this.normalizeMealBreakdown(resp.mealBreakdown, resp, prefs);

    // Compute totals
    const categoryTotals: CategoryTotal[] = [];
    let grand = 0;

    for (const cat of resp.recommendations) {
      let sum = 0;
      for (const it of cat.items) {
        sum += Number(String(it.price).replace(/[^\d.]/g, "")) || 0;
      }
      grand += sum;
      categoryTotals.push({ category: cat.category, total: `R${Math.round(sum)}` });
    }

    resp.categoryTotals = categoryTotals;
    resp.estimatedTotal = `R${Math.round(grand)}`;

    return resp;
  }

  static async testAPIKey() {
    try {
      const text = await this.generateWithRetry("Reply with: API is working", { forceJson: false });
      return { success: true, message: `OK: ${text}` };
    } catch (error: any) {
      return { success: false, message: `API error: ${error.message}` };
    }
  }
}