"""
Example Python file to test the Code Complexity Heatmap extension
This file contains functions with varying complexity levels
"""

def simple_multiply(a: int, b: int) -> int:
    """Low complexity function - Simple multiplication"""
    return a * b


def calculate_discount(price: float, customer_type: str, quantity: int) -> float:
    """Medium complexity function - Discount calculation"""
    discount = 0.0
    
    if customer_type == "premium":
        discount = 0.20
    elif customer_type == "regular":
        discount = 0.10
    elif customer_type == "new":
        discount = 0.05
    
    if quantity >= 100:
        discount += 0.15
    elif quantity >= 50:
        discount += 0.10
    elif quantity >= 10:
        discount += 0.05
    
    final_price = price * (1 - discount)
    return final_price


def process_user_data(users: list, filters: dict, sort_key: str = None) -> list:
    """High complexity function - User data processing"""
    processed_users = []
    
    for user in users:
        # Filter validation
        if filters:
            skip_user = False
            
            if 'min_age' in filters and user.get('age', 0) < filters['min_age']:
                skip_user = True
            
            if 'max_age' in filters and user.get('age', 0) > filters['max_age']:
                skip_user = True
            
            if 'country' in filters and user.get('country') != filters['country']:
                skip_user = True
            
            if 'status' in filters and user.get('status') not in filters['status']:
                skip_user = True
            
            if skip_user:
                continue
        
        # Data transformation
        transformed_user = {
            'id': user.get('id'),
            'name': user.get('name', '').title(),
            'age': user.get('age', 0),
            'country': user.get('country', 'Unknown'),
            'status': user.get('status', 'inactive')
        }
        
        # Calculate derived fields
        if transformed_user['age'] >= 18 and transformed_user['age'] < 30:
            transformed_user['age_group'] = 'young_adult'
        elif transformed_user['age'] >= 30 and transformed_user['age'] < 50:
            transformed_user['age_group'] = 'adult'
        elif transformed_user['age'] >= 50:
            transformed_user['age_group'] = 'senior'
        else:
            transformed_user['age_group'] = 'minor'
        
        processed_users.append(transformed_user)
    
    # Sort if requested
    if sort_key:
        processed_users.sort(key=lambda x: x.get(sort_key, ''))
    
    return processed_users


def complex_business_logic(
    orders: list,
    inventory: dict,
    customers: dict,
    promotions: list,
    config: dict
) -> dict:
    """Critical complexity function - Complex business logic with multiple nested conditions"""
    results = {
        'processed_orders': [],
        'failed_orders': [],
        'inventory_updates': {},
        'revenue': 0,
        'errors': []
    }
    
    if not orders or not isinstance(orders, list):
        results['errors'].append('Invalid orders data')
        return results
    
    for order in orders:
        try:
            order_total = 0
            order_items = []
            inventory_reserved = {}
            
            # Validate customer
            customer_id = order.get('customer_id')
            if not customer_id or customer_id not in customers:
                results['failed_orders'].append({
                    'order_id': order.get('order_id'),
                    'reason': 'Invalid customer'
                })
                continue
            
            customer = customers[customer_id]
            
            # Check customer credit limit
            if config.get('check_credit_limit', False):
                if customer.get('outstanding_balance', 0) > customer.get('credit_limit', 0):
                    results['failed_orders'].append({
                        'order_id': order.get('order_id'),
                        'reason': 'Credit limit exceeded'
                    })
                    continue
            
            # Process each item in the order
            for item in order.get('items', []):
                product_id = item.get('product_id')
                quantity = item.get('quantity', 0)
                
                if not product_id or quantity <= 0:
                    continue
                
                # Check inventory
                if product_id not in inventory:
                    results['errors'].append(f'Product {product_id} not found in inventory')
                    continue
                
                product = inventory[product_id]
                available_quantity = product.get('quantity', 0)
                
                # Handle backorders
                if available_quantity < quantity:
                    if config.get('allow_backorder', False):
                        if product.get('backorder_allowed', False):
                            # Partial fulfillment
                            fulfilled_quantity = available_quantity
                            backordered_quantity = quantity - available_quantity
                        else:
                            results['errors'].append(
                                f'Insufficient stock for product {product_id}'
                            )
                            continue
                    else:
                        results['errors'].append(
                            f'Insufficient stock for product {product_id}'
                        )
                        continue
                else:
                    fulfilled_quantity = quantity
                    backordered_quantity = 0
                
                # Calculate item price
                base_price = product.get('price', 0)
                item_discount = 0
                
                # Apply product-specific discounts
                if product.get('on_sale', False):
                    item_discount = base_price * product.get('sale_discount', 0)
                
                # Apply quantity-based discounts
                if quantity >= 100:
                    item_discount = max(item_discount, base_price * 0.25)
                elif quantity >= 50:
                    item_discount = max(item_discount, base_price * 0.15)
                elif quantity >= 10:
                    item_discount = max(item_discount, base_price * 0.10)
                
                # Apply customer tier discounts
                customer_tier = customer.get('tier', 'bronze')
                if customer_tier == 'platinum':
                    item_discount = max(item_discount, base_price * 0.20)
                elif customer_tier == 'gold':
                    item_discount = max(item_discount, base_price * 0.15)
                elif customer_tier == 'silver':
                    item_discount = max(item_discount, base_price * 0.10)
                
                # Apply promotions
                for promo in promotions:
                    if promo.get('active', False):
                        if promo.get('type') == 'product':
                            if product_id in promo.get('applicable_products', []):
                                promo_discount = base_price * promo.get('discount', 0)
                                item_discount = max(item_discount, promo_discount)
                        elif promo.get('type') == 'category':
                            if product.get('category') in promo.get('applicable_categories', []):
                                promo_discount = base_price * promo.get('discount', 0)
                                item_discount = max(item_discount, promo_discount)
                        elif promo.get('type') == 'customer':
                            if customer_id in promo.get('applicable_customers', []):
                                promo_discount = base_price * promo.get('discount', 0)
                                item_discount = max(item_discount, promo_discount)
                
                final_item_price = max(0, base_price - item_discount)
                item_total = final_item_price * fulfilled_quantity
                order_total += item_total
                
                # Reserve inventory
                inventory_reserved[product_id] = fulfilled_quantity
                
                order_items.append({
                    'product_id': product_id,
                    'quantity': fulfilled_quantity,
                    'backordered': backordered_quantity,
                    'unit_price': base_price,
                    'discount': item_discount,
                    'final_price': final_item_price,
                    'total': item_total
                })
            
            # Calculate shipping
            shipping_cost = 0
            if config.get('calculate_shipping', False):
                total_weight = sum(
                    inventory[item['product_id']].get('weight', 0) * item['quantity']
                    for item in order_items
                )
                
                if total_weight > 50:
                    shipping_cost = 50
                elif total_weight > 20:
                    shipping_cost = 30
                elif total_weight > 10:
                    shipping_cost = 15
                else:
                    shipping_cost = 10
                
                # Free shipping promotions
                if customer.get('tier') == 'platinum' or order_total > 200:
                    shipping_cost = 0
            
            # Calculate tax
            tax_rate = config.get('tax_rate', 0.1)
            tax_amount = order_total * tax_rate
            
            # Final order total
            final_order_total = order_total + shipping_cost + tax_amount
            
            # Update inventory
            for product_id, quantity in inventory_reserved.items():
                if product_id not in results['inventory_updates']:
                    results['inventory_updates'][product_id] = 0
                results['inventory_updates'][product_id] -= quantity
            
            # Record processed order
            results['processed_orders'].append({
                'order_id': order.get('order_id'),
                'customer_id': customer_id,
                'items': order_items,
                'subtotal': order_total,
                'shipping': shipping_cost,
                'tax': tax_amount,
                'total': final_order_total
            })
            
            results['revenue'] += final_order_total
            
        except Exception as e:
            results['failed_orders'].append({
                'order_id': order.get('order_id'),
                'reason': str(e)
            })
    
    return results
