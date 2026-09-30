# Arihant Store — Database Schema

## Entity Relationship

```
School (1) ──→ (N) Standard (1) ──→ (N) UniformItem
User   (1) ──→ (N) Address
User   (1) ──→ (1) Cart ──→ (N) UniformItem
User   (1) ──→ (N) Order ──→ (1) Payment
Order  ──→ School, Standard
```

## Collections

### schools
| Field     | Type    | Notes                    |
|-----------|---------|--------------------------|
| name      | String  | unique, required         |
| board     | String  | CBSE / ICSE / State      |
| city      | String  | required                 |
| state     | String  | required                 |
| logo      | String  | image URL                |
| banner    | String  | image URL                |
| isActive  | Boolean | default: true            |
| createdAt | Date    | auto                     |

### standards
| Field     | Type     | Notes                         |
|-----------|----------|-------------------------------|
| school    | ObjectId | ref: School, required         |
| className | String   | e.g. "Grade 5", required      |
| gender    | String   | boy / girl / unisex            |
| createdAt | Date     | auto                          |
| _index_   |          | unique(school, className, gender) |

### uniform_items
| Field       | Type     | Notes                                      |
|-------------|----------|--------------------------------------------|
| standard    | ObjectId | ref: Standard, required                    |
| itemType    | String   | shirt/pant/skirt/socks/tie/belt/shorts/blazer |
| itemName    | String   | required                                   |
| description | String   |                                            |
| price       | Number   | required                                   |
| sizes       | Array    | [{size: String, stock: Number}]            |
| imageUrl    | String   |                                            |
| isActive    | Boolean  | default: true                              |
| createdAt   | Date     | auto                                       |

### users
| Field     | Type   | Notes              |
|-----------|--------|--------------------|
| name      | String | required           |
| email     | String | unique, required   |
| phone     | String |                    |
| password  | String | bcrypt hashed      |
| role      | String | customer / admin   |
| createdAt | Date   | auto               |

### addresses
| Field     | Type     | Notes             |
|-----------|----------|-------------------|
| user      | ObjectId | ref: User         |
| street    | String   | required          |
| city      | String   | required          |
| pincode   | String   | required          |
| state     | String   | required          |
| isDefault | Boolean  | default: false    |
| createdAt | Date     | auto              |

### carts
| Field     | Type     | Notes                        |
|-----------|----------|------------------------------|
| user      | ObjectId | ref: User, unique (1 per user) |
| items     | Array    | [{item: ObjectId, size, quantity}] |
| updatedAt | Date     | auto-updated on save         |

### orders
| Field          | Type     | Notes                                     |
|----------------|----------|-------------------------------------------|
| user           | ObjectId | ref: User                                 |
| school         | ObjectId | ref: School                               |
| standard       | ObjectId | ref: Standard                             |
| items          | Array    | snapshot: [{item, itemName, itemType, size, quantity, price}] |
| totalAmount    | Number   | required                                  |
| paymentStatus  | String   | pending / paid / failed                   |
| orderStatus    | String   | pending / confirmed / packed / shipped / delivered / cancelled |
| paymentId      | ObjectId | ref: Payment                              |
| shippingAddress| Object   | {street, city, pincode, state}            |
| createdAt      | Date     | auto                                      |

### payments
| Field              | Type     | Notes                      |
|--------------------|----------|----------------------------|
| order              | ObjectId | ref: Order                 |
| gatewayReferenceId | String   | Razorpay/gateway ref       |
| amount             | Number   | required                   |
| method             | String   | UPI / Card / NetBanking / COD |
| status             | String   | pending / success / failed |
| timestamp          | Date     | auto                       |
