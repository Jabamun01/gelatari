/** Full flavor document as returned by the API. */
export interface IceCreamFlavor {
  _id: string;
  name: string;
  iceCreamMixKg: number;
  totalMixConvertedKg: number;
  totalFrozenProducedL: number;

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
  overrunPercent?: number;
}

/** Dashboard item with computed alert fields. */
export interface DashboardFlavor {
  _id: string;
  name: string;
  iceCreamMixKg: number;
  overrunPercent: number;
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

/** DTO for creating a flavor. */
export interface CreateFlavorDto {
  name: string;
}

/** DTO for updating a flavor. */
export interface UpdateFlavorDto {
  name?: string;
  essentialLarge?: boolean;
  essentialSmall?: boolean;
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
