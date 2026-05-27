// Powered by OnSpace.AI
export const EXPIRY_THRESHOLDS = {
  EXPIRED: 0,      // 0 days = expired
  CRITICAL: 3,     // <= 3 days = expiring very soon
  SOON: 7,         // <= 7 days = expiring soon
};

export const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🛒' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'produce', label: 'Produce', emoji: '🥦' },
  { id: 'meat', label: 'Meat', emoji: '🥩' },
  { id: 'bakery', label: 'Bakery', emoji: '🍞' },
  { id: 'frozen', label: 'Frozen', emoji: '🧊' },
  { id: 'pantry', label: 'Pantry', emoji: '🥫' },
  { id: 'drinks', label: 'Drinks', emoji: '🧃' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export const MOCK_BARCODE_PRODUCTS = [
  { name: 'Whole Milk', category: 'dairy', quantity: '1 gallon' },
  { name: 'Greek Yogurt', category: 'dairy', quantity: '32 oz' },
  { name: 'Cheddar Cheese', category: 'dairy', quantity: '8 oz' },
  { name: 'Baby Spinach', category: 'produce', quantity: '5 oz bag' },
  { name: 'Cherry Tomatoes', category: 'produce', quantity: '1 pint' },
  { name: 'Sourdough Bread', category: 'bakery', quantity: '1 loaf' },
  { name: 'Orange Juice', category: 'drinks', quantity: '52 fl oz' },
  { name: 'Chicken Breast', category: 'meat', quantity: '2 lbs' },
  { name: 'Frozen Peas', category: 'frozen', quantity: '12 oz' },
  { name: 'Peanut Butter', category: 'pantry', quantity: '16 oz' },
];

export const STORAGE_KEY = 'expiry_manager_items';
