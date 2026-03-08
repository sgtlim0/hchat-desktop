/**
 * Demo script showcasing Pipeline functionality
 * Run with: npx tsx src/shared/lib/__tests__/collection-pipeline.demo.ts
 */

import { Pipeline } from '../collection-pipeline'

// Example 1: Basic number transformations
console.log('Example 1: Number transformations')
const numbers = Pipeline.from([5, 3, 8, 1, 9, 2, 7, 4, 6])
  .filter(x => x > 3)        // Keep only numbers > 3: [5, 8, 9, 7, 4, 6]
  .map(x => x * 2)           // Double them: [10, 16, 18, 14, 8, 12]
  .sort((a, b) => a - b)     // Sort ascending: [8, 10, 12, 14, 16, 18]
  .take(3)                   // Take first 3: [8, 10, 12]
  .toArray()
console.log('Result:', numbers)
console.log()

// Example 2: Working with objects
interface Product {
  id: number
  name: string
  price: number
  category: string
}

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 1200, category: 'Electronics' },
  { id: 2, name: 'Mouse', price: 25, category: 'Electronics' },
  { id: 3, name: 'Desk', price: 450, category: 'Furniture' },
  { id: 4, name: 'Chair', price: 200, category: 'Furniture' },
  { id: 5, name: 'Monitor', price: 350, category: 'Electronics' },
]

console.log('Example 2: Product filtering and mapping')
const expensiveElectronics = Pipeline.from(products)
  .filter(p => p.category === 'Electronics')
  .filter(p => p.price > 100)
  .sort((a, b) => b.price - a.price)
  .map(p => `${p.name}: $${p.price}`)
  .toArray()
console.log('Expensive electronics:', expensiveElectronics)
console.log()

// Example 3: Pagination
console.log('Example 3: Pagination')
const allItems = Array.from({ length: 25 }, (_, i) => i + 1)
const pageSize = 5

for (let page = 0; page < 3; page++) {
  const pageItems = Pipeline.from(allItems)
    .skip(page * pageSize)
    .take(pageSize)
    .toArray()
  console.log(`Page ${page + 1}:`, pageItems)
}
console.log()

// Example 4: Aggregation with reduce
console.log('Example 4: Aggregation')
const totalPrice = Pipeline.from(products)
  .filter(p => p.category === 'Electronics')
  .reduce((sum, p) => sum + p.price, 0)
console.log('Total electronics price:', `$${totalPrice}`)

const productsByCategory = Pipeline.from(products)
  .reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p.name)
    return acc
  }, {} as Record<string, string[]>)
console.log('Products by category:', productsByCategory)
console.log()

// Example 5: Finding items
console.log('Example 5: Finding items')
const firstExpensive = Pipeline.from(products)
  .filter(p => p.price > 500)
  .sort((a, b) => b.price - a.price)
  .first()
console.log('Most expensive item over $500:', firstExpensive?.name)

const cheapestProduct = Pipeline.from(products)
  .sort((a, b) => a.price - b.price)
  .first()
console.log('Cheapest product:', cheapestProduct?.name)
console.log()

// Example 6: Immutability demonstration
console.log('Example 6: Immutability')
const original = [3, 1, 2]
console.log('Original array:', original)

const pipeline = Pipeline.from(original)
const sorted = pipeline.sort((a, b) => a - b).toArray()
console.log('Sorted result:', sorted)
console.log('Original unchanged:', original)