/** A mix-in ingredient folded into the ice cream at churn time. */
export interface MixIn {
  ingredient: { _id: string; name: string };
  amountPerKg: number; // grams per kg of mix used
}

/** Full flavor document as returned by the API. */
export interface IceCreamFlavor {
  _id: string;
  name: string;
  sourceRecipeId?: string;
  mixIns: MixIn[];

  // Large containers
  largeWarehouseContainers: number;
  largeWarehouseLiters: number;
  largeParadetaContainers: number;
  largeParadetaLiters: number;

  // Small containers
  smallWarehouseCount: number;
  smallParadetaCount: number;

  // Essential flags
  essentialLarge: boolean;
  essentialSmall: boolean;

  // Virtuals (included in JSON by Mongoose)
  totalLargeContainers?: number;
  totalLargeLiters?: number;
  totalSmallCount?: number;
  totalFrozenLiters?: number;
  averageLargeContainerLiters?: number;
}

/** Dashboard item with computed alert fields. Mix info comes from the parent recipe. */
export interface DashboardFlavor {
  _id: string;
  name: string;
  sourceRecipeId?: string;
  sourceRecipeName?: string;
  mixIns: Array<{
    ingredient: string;
    ingredientName?: string;
    amountPerKg: number;
  }>;
  // Mix info (pulled from parent recipe, shared across all flavor variants)
  iceCreamMixKg: number;
  overrunPercent: number;
  // Container stats (on the flavor itself)
  totalFrozenLiters: number;
  totalLargeContainers: number;
  totalLargeLiters: number;
  totalSmallCount: number;
  largeWarehouseContainers: number;
  largeWarehouseLiters: number;
  largeParadetaContainers: number;
  largeParadetaLiters: number;
  smallWarehouseCount: number;
  smallParadetaCount: number;
  essentialLarge: boolean;
  essentialSmall: boolean;
  paradetaTotalLiters: number;
  warehouseTotalLiters: number;
  alerts: {
    paradetaLow: boolean;
    overallLow: boolean;
  };
}

/** DTO for creating a flavor variant (linked to an existing recipe). */
export interface CreateFlavorDto {
  name: string;
  sourceRecipeId: string;
  mixIns?: Array<{ ingredient: string; amountPerKg: number }>;
}

/** DTO for updating a flavor. */
export interface UpdateFlavorDto {
  name?: string;
  essentialLarge?: boolean;
  essentialSmall?: boolean;
  mixIns?: Array<{ ingredient: string; amountPerKg: number }>;
}

/** DTO for converting mix to frozen containers. */
export interface ConvertMixDto {
  mixKg: number;
  frozenLiters: number;
  largeContainers: number;
  smallContainers: number;
}

/** DTO for selling a container. */
export interface SellContainerDto {
  containerType: 'large' | 'small';
  location: 'warehouse' | 'paradeta';
}

/** DTO for moving containers between locations. */
export interface MoveContainersDto {
  containerType: 'large' | 'small';
  count: number;
  from: 'warehouse' | 'paradeta';
  to: 'warehouse' | 'paradeta';
}

/** DTO for directly setting stock values on a flavor (containers only; mix is on the recipe). */
export interface SetFlavorStockDto {
  largeWarehouseContainers?: number;
  largeWarehouseLiters?: number;
  largeParadetaContainers?: number;
  largeParadetaLiters?: number;
  smallWarehouseCount?: number;
  smallParadetaCount?: number;
}

/** Response from a reset endpoint. */
export interface ResetResponse {
  message: string;
  modifiedCount: number;
}
