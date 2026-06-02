
export interface FoodProduct {
  name: string;
  category: string;
  quantity: string;
  brand: string;
  found: boolean;
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v0/product';

function mapCategory(categoriesTags: string[]): string {
  if (!categoriesTags?.length) return 'other';
  const joined = categoriesTags.join(' ').toLowerCase();
  if (
    joined.includes('dairy') ||
    joined.includes('milk') ||
    joined.includes('cheese') ||
    joined.includes('yogurt') ||
    joined.includes('butter') ||
    joined.includes('cream')
  )
    return 'dairy';
  if (
    joined.includes('meat') ||
    joined.includes('fish') ||
    joined.includes('seafood') ||
    joined.includes('poultry') ||
    joined.includes('beef') ||
    joined.includes('pork') ||
    joined.includes('chicken')
  )
    return 'meat';
  if (
    joined.includes('beverage') ||
    joined.includes('drink') ||
    joined.includes('juice') ||
    joined.includes('water') ||
    joined.includes('soda') ||
    joined.includes('coffee') ||
    joined.includes('tea')
  )
    return 'drinks';
  if (joined.includes('frozen')) return 'frozen';
  if (
    joined.includes('bread') ||
    joined.includes('biscuit') ||
    joined.includes('bakery') ||
    joined.includes('cake') ||
    joined.includes('pastry')
  )
    return 'bakery';
  if (
    joined.includes('vegetable') ||
    joined.includes('fruit') ||
    joined.includes('produce') ||
    joined.includes('salad') ||
    joined.includes('herb')
  )
    return 'produce';
  if (
    joined.includes('cereal') ||
    joined.includes('pasta') ||
    joined.includes('rice') ||
    joined.includes('canned') ||
    joined.includes('sauce') ||
    joined.includes('oil') ||
    joined.includes('snack') ||
    joined.includes('condiment')
  )
    return 'pantry';
  return 'other';
}

export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct> {
  try {
    const response = await fetch(`${OFF_BASE}/${barcode}.json`, {
      headers: {
        'User-Agent': 'ExpiryDateManager/1.0',
      },
    });

    if (!response.ok) {
      return { name: '', category: 'other', quantity: '', brand: '', found: false };
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { name: '', category: 'other', quantity: '', brand: '', found: false };
    }

    const product = data.product;
    const name: string =
      product.product_name_en ||
      product.product_name ||
      product.abbreviated_product_name ||
      '';

    const brand: string = product.brands || '';
    const quantity: string = product.quantity || product.net_weight_value || '';
    const categoriesTags: string[] = product.categories_tags || [];
    const category = mapCategory(categoriesTags);

    return { name: name.trim(), category, quantity: quantity.trim(), brand: brand.trim(), found: true };
  } catch {
    return { name: '', category: 'other', quantity: '', brand: '', found: false };
  }
}
