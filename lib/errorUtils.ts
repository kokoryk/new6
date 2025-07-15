export function isUsageLimitError(error: Error): boolean {
  return /USAGE_LIMIT_ERROR/.test(error.message);
}

export function isFoodLimitError(error: Error): boolean {
  return /FOOD_LIMIT_ERROR/.test(error.message);
}