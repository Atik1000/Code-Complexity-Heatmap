// Example file to test the Code Complexity Heatmap extension
// This file contains functions with varying complexity levels

/**
 * Low complexity function - Simple addition
 */
function simpleAddition(a, b) {
  return a + b;
}

/**
 * Medium complexity function - Form validation
 */
function validateUserInput(email, password, age) {
  if (!email || !password) {
    return false;
  }

  if (email.indexOf("@") === -1) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  if (age && age < 18) {
    return false;
  }

  return true;
}

/**
 * High complexity function - Complex business logic
 */
function processOrderWithDiscounts(order, customer, promotions) {
  let totalPrice = 0;
  let discount = 0;

  // Calculate base price
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    if (item.quantity > 0) {
      totalPrice += item.price * item.quantity;

      // Bulk discount
      if (item.quantity >= 10) {
        discount += item.price * item.quantity * 0.1;
      } else if (item.quantity >= 5) {
        discount += item.price * item.quantity * 0.05;
      }
    }
  }

  // Customer loyalty discount
  if (customer.loyaltyPoints > 1000) {
    discount += totalPrice * 0.15;
  } else if (customer.loyaltyPoints > 500) {
    discount += totalPrice * 0.1;
  } else if (customer.loyaltyPoints > 100) {
    discount += totalPrice * 0.05;
  }

  // Promotional discounts
  if (promotions && promotions.length > 0) {
    for (let j = 0; j < promotions.length; j++) {
      const promo = promotions[j];

      if (promo.type === "percentage") {
        if (totalPrice >= promo.minPurchase) {
          discount += totalPrice * (promo.value / 100);
        }
      } else if (promo.type === "fixed") {
        discount += promo.value;
      } else if (promo.type === "bogo") {
        // Buy one get one logic
        for (let k = 0; k < order.items.length; k++) {
          if (order.items[k].category === promo.category) {
            discount +=
              order.items[k].price * Math.floor(order.items[k].quantity / 2);
          }
        }
      }
    }
  }

  const finalPrice = Math.max(0, totalPrice - discount);

  return {
    subtotal: totalPrice,
    discount: discount,
    total: finalPrice,
    savings: discount,
  };
}

/**
 * Critical complexity function - Nested algorithms with multiple conditions
 */
function complexDataProcessor(data, config, filters, transformers) {
  const results = [];
  const errors = [];
  let processedCount = 0;
  let skippedCount = 0;

  if (!data || !Array.isArray(data)) {
    return { results: [], errors: ["Invalid data"], stats: {} };
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let shouldProcess = true;

    // Apply filters
    if (filters && filters.length > 0) {
      for (let j = 0; j < filters.length; j++) {
        const filter = filters[j];

        if (filter.type === "range") {
          if (
            item[filter.field] < filter.min ||
            item[filter.field] > filter.max
          ) {
            shouldProcess = false;
            break;
          }
        } else if (filter.type === "match") {
          if (item[filter.field] !== filter.value) {
            shouldProcess = false;
            break;
          }
        } else if (filter.type === "regex") {
          const regex = new RegExp(filter.pattern);
          if (!regex.test(item[filter.field])) {
            shouldProcess = false;
            break;
          }
        } else if (filter.type === "custom") {
          try {
            if (!filter.fn(item)) {
              shouldProcess = false;
              break;
            }
          } catch (e) {
            errors.push(`Filter error at index ${i}: ${e.message}`);
            shouldProcess = false;
            break;
          }
        }
      }
    }

    if (!shouldProcess) {
      skippedCount++;
      continue;
    }

    // Apply transformations
    let transformedItem = { ...item };

    if (transformers && transformers.length > 0) {
      for (let k = 0; k < transformers.length; k++) {
        const transformer = transformers[k];

        try {
          if (transformer.type === "map") {
            transformedItem[transformer.target] = transformer.fn(
              transformedItem[transformer.source],
            );
          } else if (transformer.type === "compute") {
            transformedItem[transformer.field] =
              transformer.fn(transformedItem);
          } else if (transformer.type === "aggregate") {
            if (transformer.condition(transformedItem)) {
              const existing = results.find(
                (r) => r.id === transformedItem[transformer.groupBy],
              );
              if (existing) {
                existing[transformer.field] = transformer.aggregateFn(
                  existing[transformer.field],
                  transformedItem[transformer.field],
                );
              } else {
                results.push(transformedItem);
              }
            }
          }

          // Validation after transformation
          if (config.validateAfterTransform) {
            for (let field in config.validationRules) {
              const rule = config.validationRules[field];

              if (rule.required && !transformedItem[field]) {
                throw new Error(`Required field ${field} is missing`);
              }

              if (
                rule.type === "number" &&
                typeof transformedItem[field] !== "number"
              ) {
                throw new Error(`Field ${field} must be a number`);
              }

              if (rule.min !== undefined && transformedItem[field] < rule.min) {
                throw new Error(`Field ${field} is below minimum value`);
              }

              if (rule.max !== undefined && transformedItem[field] > rule.max) {
                throw new Error(`Field ${field} exceeds maximum value`);
              }
            }
          }
        } catch (e) {
          errors.push(`Transformation error at index ${i}: ${e.message}`);
          skippedCount++;
          continue;
        }
      }
    }

    // Final processing
    if (config.deduplicate) {
      const duplicate = results.find((r) => {
        for (let field of config.deduplicateFields) {
          if (r[field] !== transformedItem[field]) {
            return false;
          }
        }
        return true;
      });

      if (duplicate) {
        if (config.mergeStrategy === "latest") {
          Object.assign(duplicate, transformedItem);
        } else if (config.mergeStrategy === "sum") {
          for (let field of config.mergeFields) {
            duplicate[field] =
              (duplicate[field] || 0) + (transformedItem[field] || 0);
          }
        }
      } else {
        results.push(transformedItem);
      }
    } else {
      results.push(transformedItem);
    }

    processedCount++;
  }

  // Sort results if configured
  if (config.sortBy) {
    results.sort((a, b) => {
      const aVal = a[config.sortBy];
      const bVal = b[config.sortBy];

      if (config.sortOrder === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  }

  return {
    results,
    errors,
    stats: {
      total: data.length,
      processed: processedCount,
      skipped: skippedCount,
      errorCount: errors.length,
    },
  };
}

// Export functions
module.exports = {
  simpleAddition,
  validateUserInput,
  processOrderWithDiscounts,
  complexDataProcessor,
};
