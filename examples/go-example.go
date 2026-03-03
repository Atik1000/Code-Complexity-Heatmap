package main

import (
	"fmt"
	"strings"
	"time"
)

// Example Go code to demonstrate complexity analysis

// Low complexity function
func SimpleGreeting(name string) string {
	return fmt.Sprintf("Hello, %s!", name)
}

// Medium complexity function
func ProcessUser(user User, role string) (bool, error) {
	if !user.IsActive {
		return false, fmt.Errorf("user is not active")
	}

	if role == "admin" {
		return grantAdminAccess(user), nil
	} else if role == "moderator" {
		return grantModeratorAccess(user), nil
	} else {
		return grantUserAccess(user), nil
	}
}

// High complexity function - needs refactoring!
func ValidateUserData(data map[string]interface{}, options map[string]bool) (bool, []string) {
	errors := []string{}

	// Email validation with deep nesting
	if email, ok := data["email"].(string); ok {
		if email != "" {
			if strings.Contains(email, "@") {
				if emailExists(email) {
					errors = append(errors, "Email already exists")
				} else {
					if requireVerification, ok := options["requireVerification"]; ok {
						if requireVerification {
							if _, hasCode := data["verification_code"]; !hasCode {
								errors = append(errors, "Verification code required")
							}
						}
					}
				}
			} else {
				errors = append(errors, "Invalid email format")
			}
		}
	}

	// Password validation
	if password, ok := data["password"].(string); ok {
		if len(password) < 8 {
			errors = append(errors, "Password too short")
		} else if !hasUpperCase(password) {
			errors = append(errors, "Password needs uppercase letter")
		} else if !hasNumber(password) {
			errors = append(errors, "Password needs a number")
		}
	}

	// Age validation
	if age, ok := data["age"].(int); ok {
		if age < 18 {
			errors = append(errors, "Must be 18 or older")
		} else if age > 120 {
			errors = append(errors, "Invalid age")
		}
	}

	return len(errors) == 0, errors
}

// Critical complexity - urgent refactoring needed!
func ProcessOrder(order Order, customer Customer, payment Payment, shipping Shipping, discount *Discount) (*OrderResult, error) {
	var total float64
	status := "pending"

	// Complex nested loops and conditions
	for _, item := range order.Items {
		if item.Available {
			if item.Stock > 0 {
				if item.Price > 0 {
					itemTotal := item.Price * float64(item.Quantity)

					// Apply discount
					if discount != nil {
						if discount.Type == "percentage" {
							itemTotal -= (itemTotal * discount.Value / 100)
						} else if discount.Type == "fixed" {
							itemTotal -= discount.Value
						}
					}

					// Membership discount
					if customer.Membership == "premium" {
						itemTotal *= 0.9 // 10% discount
					} else if customer.Membership == "gold" {
						itemTotal *= 0.85 // 15% discount
					} else if customer.Membership == "platinum" {
						itemTotal *= 0.8 // 20% discount
					}

					total += itemTotal
				}
			}
		}
	}

	// Payment processing with multiple conditions
	if payment.Method == "credit_card" {
		if payment.Verified {
			if total > 0 {
				charged, err := chargeCard(payment.Token, total)
				if err != nil {
					return nil, fmt.Errorf("payment failed: %v", err)
				}
				if charged {
					status = "paid"
				} else {
					return nil, fmt.Errorf("card charge failed")
				}
			}
		} else {
			return nil, fmt.Errorf("card not verified")
		}
	} else if payment.Method == "paypal" {
		if payment.Email != "" {
			charged, err := chargePayPal(payment.Email, total)
			if err != nil {
				return nil, fmt.Errorf("PayPal payment failed: %v", err)
			}
			if charged {
				status = "paid"
			}
		}
	} else if payment.Method == "bank_transfer" {
		status = "awaiting_transfer"
	} else if payment.Method == "crypto" {
		if payment.WalletAddress != "" {
			if total >= 10 {
				charged, err := chargeCrypto(payment.WalletAddress, total)
				if err != nil {
					return nil, err
				}
				if charged {
					status = "paid"
				}
			} else {
				return nil, fmt.Errorf("minimum amount for crypto is $10")
			}
		}
	}

	// Shipping logic
	if status == "paid" {
		if shipping.Method == "express" {
			if shipping.Address.Country == "US" {
				scheduleExpressShipping(order, shipping)
			} else if shipping.Address.Country == "CA" {
				scheduleInternationalExpress(order, shipping, "Canada")
			} else if shipping.Address.Country == "MX" {
				scheduleInternationalExpress(order, shipping, "Mexico")
			} else {
				scheduleInternationalExpress(order, shipping, "International")
			}
		} else if shipping.Method == "standard" {
			scheduleStandardShipping(order, shipping)
		} else if shipping.Method == "overnight" {
			if shipping.Address.Country == "US" {
				scheduleOvernightShipping(order, shipping)
			} else {
				return nil, fmt.Errorf("overnight shipping only available in US")
			}
		}
	}

	orderID, err := saveOrder(order, customer, total, status)
	if err != nil {
		return nil, err
	}

	return &OrderResult{
		Status:  status,
		Total:   total,
		OrderID: orderID,
	}, nil
}

// Type definitions
type User struct {
	ID       int
	Name     string
	Email    string
	IsActive bool
}

type Order struct {
	Items []OrderItem
}

type OrderItem struct {
	Name      string
	Price     float64
	Quantity  int
	Stock     int
	Available bool
}

type Customer struct {
	ID         int
	Name       string
	Membership string
}

type Payment struct {
	Method        string
	Token         string
	Email         string
	WalletAddress string
	Verified      bool
}

type Shipping struct {
	Method  string
	Address Address
}

type Address struct {
	Street  string
	City    string
	Country string
}

type Discount struct {
	Type  string
	Value float64
}

type OrderResult struct {
	Status  string
	Total   float64
	OrderID int
}

// Helper functions
func emailExists(email string) bool                                        { return false }
func hasUpperCase(s string) bool                                           { return true }
func hasNumber(s string) bool                                              { return true }
func grantAdminAccess(user User) bool                                      { return true }
func grantModeratorAccess(user User) bool                                  { return true }
func grantUserAccess(user User) bool                                       { return true }
func chargeCard(token string, amount float64) (bool, error)                { return true, nil }
func chargePayPal(email string, amount float64) (bool, error)              { return true, nil }
func chargeCrypto(wallet string, amount float64) (bool, error)             { return true, nil }
func scheduleExpressShipping(order Order, shipping Shipping)               {}
func scheduleInternationalExpress(order Order, shipping Shipping, region string) {}
func scheduleStandardShipping(order Order, shipping Shipping)              {}
func scheduleOvernightShipping(order Order, shipping Shipping)             {}
func saveOrder(order Order, customer Customer, total float64, status string) (int, error) {
	return 1, nil
}

func main() {
	fmt.Println("Go Complexity Analysis Example")
	fmt.Println(SimpleGreeting("Developer"))
}
