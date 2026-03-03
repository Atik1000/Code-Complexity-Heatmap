<?php

namespace App\Controllers;

/**
 * Example PHP/Laravel controller to demonstrate complexity analysis
 */
class UserController
{
    /**
     * Low complexity function
     */
    public function simpleFunction($id)
    {
        return "User ID: " . $id;
    }

    /**
     * Medium complexity function with some conditions
     */
    public function processUser($user, $role)
    {
        if ($user->isActive()) {
            if ($role === 'admin') {
                return $this->grantAdminAccess($user);
            } elseif ($role === 'moderator') {
                return $this->grantModeratorAccess($user);
            } else {
                return $this->grantUserAccess($user);
            }
        }
        return false;
    }

    /**
     * High complexity function - needs refactoring!
     */
    public function complexUserValidation($userData, $options = [])
    {
        $errors = [];
        
        // Deep nesting and multiple conditions
        if (isset($userData['email'])) {
            if (filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
                if ($this->emailExists($userData['email'])) {
                    $errors['email'] = 'Email already exists';
                } else {
                    if (isset($options['requireVerification'])) {
                        if ($options['requireVerification'] === true) {
                            if (!isset($userData['verification_code'])) {
                                $errors['verification'] = 'Verification code required';
                            }
                        }
                    }
                }
            } else {
                $errors['email'] = 'Invalid email format';
            }
        }

        if (isset($userData['password'])) {
            if (strlen($userData['password']) < 8) {
                $errors['password'] = 'Password too short';
            } elseif (!preg_match('/[A-Z]/', $userData['password'])) {
                $errors['password'] = 'Password needs uppercase';
            } elseif (!preg_match('/[0-9]/', $userData['password'])) {
                $errors['password'] = 'Password needs number';
            }
        }

        if (isset($userData['age'])) {
            if ($userData['age'] < 18) {
                $errors['age'] = 'Must be 18 or older';
            } elseif ($userData['age'] > 120) {
                $errors['age'] = 'Invalid age';
            }
        }

        // Multiple return points
        if (count($errors) > 0) {
            return ['valid' => false, 'errors' => $errors];
        }

        if (isset($options['saveToDatabase'])) {
            if ($options['saveToDatabase'] === true) {
                $saved = $this->saveUser($userData);
                if ($saved) {
                    return ['valid' => true, 'user_id' => $saved->id];
                } else {
                    return ['valid' => false, 'errors' => ['database' => 'Save failed']];
                }
            }
        }

        return ['valid' => true];
    }

    /**
     * Critical complexity - urgent refactoring needed!
     */
    public function processOrder($order, $customer, $payment, $shipping, $discount = null)
    {
        $total = 0;
        $status = 'pending';

        foreach ($order['items'] as $item) {
            if ($item['available']) {
                if ($item['stock'] > 0) {
                    if ($item['price'] > 0) {
                        $itemTotal = $item['price'] * $item['quantity'];
                        
                        if ($discount !== null) {
                            if ($discount['type'] === 'percentage') {
                                $itemTotal -= ($itemTotal * $discount['value'] / 100);
                            } elseif ($discount['type'] === 'fixed') {
                                $itemTotal -= $discount['value'];
                            }
                        }

                        if ($customer['membership'] === 'premium') {
                            $itemTotal *= 0.9; // 10% discount
                        } elseif ($customer['membership'] === 'gold') {
                            $itemTotal *= 0.85; // 15% discount
                        }

                        $total += $itemTotal;
                    }
                }
            }
        }

        if ($payment['method'] === 'credit_card') {
            if ($payment['verified']) {
                if ($total > 0) {
                    if ($this->chargeCard($payment['token'], $total)) {
                        $status = 'paid';
                    } else {
                        return ['error' => 'Payment failed'];
                    }
                }
            } else {
                return ['error' => 'Card not verified'];
            }
        } elseif ($payment['method'] === 'paypal') {
            if ($payment['email']) {
                if ($this->chargePayPal($payment['email'], $total)) {
                    $status = 'paid';
                } else {
                    return ['error' => 'PayPal payment failed'];
                }
            }
        } elseif ($payment['method'] === 'bank_transfer') {
            $status = 'awaiting_transfer';
        }

        if ($status === 'paid') {
            if ($shipping['method'] === 'express') {
                if ($shipping['address']['country'] === 'US') {
                    $this->scheduleExpressShipping($order, $shipping);
                } else {
                    $this->scheduleInternationalExpress($order, $shipping);
                }
            } elseif ($shipping['method'] === 'standard') {
                $this->scheduleStandardShipping($order, $shipping);
            }
        }

        return [
            'status' => $status,
            'total' => $total,
            'order_id' => $this->saveOrder($order, $customer, $total, $status)
        ];
    }

    // Helper methods
    private function emailExists($email) { return false; }
    private function grantAdminAccess($user) { return true; }
    private function grantModeratorAccess($user) { return true; }
    private function grantUserAccess($user) { return true; }
    private function saveUser($userData) { return (object)['id' => 1]; }
    private function chargeCard($token, $amount) { return true; }
    private function chargePayPal($email, $amount) { return true; }
    private function scheduleExpressShipping($order, $shipping) {}
    private function scheduleInternationalExpress($order, $shipping) {}
    private function scheduleStandardShipping($order, $shipping) {}
    private function saveOrder($order, $customer, $total, $status) { return 1; }
}
