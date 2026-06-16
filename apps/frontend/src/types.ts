/** Variant strings used by Alert and useAlert throughout the app. */
export type AlertVariant = '' | 'danger' | 'info' | 'loading' | 'primary' | 'success' | 'warning';

export type BoardType = 'osrs' | 'generic';

export const DEFAULT_BOARD_TYPE: BoardType = 'osrs';

export function normalizeBoardType(value: unknown): BoardType {
  return value === 'generic' || value === 'plain' ? 'generic' : DEFAULT_BOARD_TYPE;
}
