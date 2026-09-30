const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const School = require('./models/School');
const SchoolStandard = require('./models/Standard');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const Accessory = require('./models/Accessory');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// ─────────────────────────────────────────────────────────────
// SIZE DEFINITIONS
// ─────────────────────────────────────────────────────────────
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['UK3', 'UK4', 'UK5', 'UK6', 'UK7', 'UK8', 'UK9', 'UK10'];
const SOCK_SIZES = ['S', 'M', 'L'];

// ─────────────────────────────────────────────────────────────
// HELPER: determine size type from item_type and product name
// ─────────────────────────────────────────────────────────────
function getSizeType(itemType, productName) {
  if (itemType === 'shoes') return 'shoes';
  if (itemType === 'socks') return 'socks';
  return 'clothing';
}

function getSizes(sizeType) {
  switch (sizeType) {
    case 'shoes': return SHOE_SIZES;
    case 'socks': return SOCK_SIZES;
    default: return CLOTHING_SIZES;
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: create a product and its variants
// ─────────────────────────────────────────────────────────────
async function createProductWithVariants(productData, sizeType) {
  const product = await Product.create(productData);

  const sizes = getSizes(sizeType);
  const variants = sizes.map(size => ({
    product_id: product._id,
    size,
    stock_qty: 0,
    is_available: true
  }));

  await ProductVariant.insertMany(variants);
  return { product, variantCount: variants.length };
}

// ─────────────────────────────────────────────────────────────
// HELPER: create all products for a standard
// ─────────────────────────────────────────────────────────────
async function createProductsForStandard(schoolId, standardId, items) {
  let productCount = 0;
  let variantCount = 0;

  for (const item of items) {
    try {
      const sizeType = getSizeType(item.item_type, item.name);
      const result = await createProductWithVariants({
        standard_id: standardId,
        school_id: schoolId,
        name: item.name,
        item_type: item.item_type,
        uniform_type: item.uniform_type,
        price_paisa: 0,
        image_url: null,
        is_active: true
      }, sizeType);
      productCount++;
      variantCount += result.variantCount;
    } catch (err) {
      console.error(`  ❌ Failed to insert product "${item.name}": ${err.message}`);
    }
  }

  return { productCount, variantCount };
}

// ─────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────
const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: DELETE ALL EXISTING MOCK DATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Clear order-related collections first (they reference others)
    await Order.deleteMany({});
    await Cart.deleteMany({});

    // Clear product-related collections
    await ProductVariant.deleteMany({});
    await Product.deleteMany({});

    // Clear school-related collections
    await SchoolStandard.deleteMany({});
    await School.deleteMany({});

    // Clear accessories
    await Accessory.deleteMany({});

    // Also clear legacy UniformItem collection if it exists
    try {
      await mongoose.connection.collection('uniformitems').drop();
      console.log('🗑️  Dropped legacy uniformitems collection.');
    } catch (e) {
      // Collection may not exist, that's fine
    }

    console.log('🗑️  All mock data cleared.\n');

    // Counters
    let totalProducts = 0;
    let totalVariants = 0;
    let totalStandards = 0;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHOOL 1: JAMNABAH NARSEE SCHOOL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const jns = await School.create({
      name: 'Jamnabah Narsee School',
      area: 'Kudasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      is_active: true
    });

    // Nursery/KG — boy
    const jns_nkg_boy = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Nursery/KG', gender: 'boy', division: 'primary', is_active: true
    });
    let res = await createProductsForStandard(jns._id, jns_nkg_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Half Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Nursery/KG — girl
    const jns_nkg_girl = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Nursery/KG', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(jns._id, jns_nkg_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Skirt', item_type: 'skirt', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 5 — boy
    const jns_1to5_boy = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Std 1 to 5', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(jns._id, jns_1to5_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Half Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'House Jacket', item_type: 'jacket', uniform_type: 'house' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 5 — girl
    const jns_1to5_girl = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Std 1 to 5', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(jns._id, jns_1to5_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Pina Frock', item_type: 'frock', uniform_type: 'regular' },
      { name: 'House Top', item_type: 'top', uniform_type: 'house' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Black Cycling Shorts', item_type: 'shorts', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 6 to 10 — boy
    const jns_6to10_boy = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Std 6 to 10', gender: 'boy', division: 'secondary', is_active: true
    });
    res = await createProductsForStandard(jns._id, jns_6to10_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'House Sports T-Shirt', item_type: 't-shirt', uniform_type: 'house' },
      { name: 'House Sports Track', item_type: 'track', uniform_type: 'house' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 6 to 10 — girl
    const jns_6to10_girl = await SchoolStandard.create({
      school_id: jns._id, class_name: 'Std 6 to 10', gender: 'girl', division: 'secondary', is_active: true
    });
    res = await createProductsForStandard(jns._id, jns_6to10_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Pina Frock', item_type: 'frock', uniform_type: 'regular' },
      { name: 'House Pina Frock', item_type: 'frock', uniform_type: 'house' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Black Cycling Shorts', item_type: 'shorts', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    console.log('Inserted: Jamnabah Narsee School');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHOOL 2: KAMESHWAR INTERNATIONAL SCHOOL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const kis = await School.create({
      name: 'Kameshwar International School',
      area: 'Kudasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      is_active: true
    });

    // Nursery/KG — boy
    const kis_nkg_boy = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Nursery/KG', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_nkg_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Nursery/KG — girl
    const kis_nkg_girl = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Nursery/KG', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_nkg_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — boy
    const kis_1to8_boy = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Std 1 to 8', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_1to8_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Tie', item_type: 'tie', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — girl
    const kis_1to8_girl = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Std 1 to 8', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_1to8_girl._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Tie', item_type: 'tie', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — boy
    const kis_9to12_boy = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Std 9 to 12', gender: 'boy', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_9to12_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Blazer', item_type: 'blazer', uniform_type: 'regular' },
      { name: 'Tie', item_type: 'tie', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — girl
    const kis_9to12_girl = await SchoolStandard.create({
      school_id: kis._id, class_name: 'Std 9 to 12', gender: 'girl', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(kis._id, kis_9to12_girl._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Blazer', item_type: 'blazer', uniform_type: 'regular' },
      { name: 'Tie', item_type: 'tie', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    console.log('Inserted: Kameshwar International School');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHOOL 3: ACHIEVER SCHOOL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const ach = await School.create({
      name: 'Achiever School',
      area: 'Kudasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      is_active: true
    });

    // Nursery/KG — boy
    const ach_nkg_boy = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Nursery/KG', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_nkg_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Capri', item_type: 'capri', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani / Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Nursery/KG — girl
    const ach_nkg_girl = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Nursery/KG', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_nkg_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Capri', item_type: 'capri', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani / Liberty Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — boy
    const ach_1to8_boy = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Std 1 to 8', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_1to8_boy._id, [
      { name: 'T-Shirt (Pack of 3)', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks (Pack of 3)', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — girl
    const ach_1to8_girl = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Std 1 to 8', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_1to8_girl._id, [
      { name: 'T-Shirt (Pack of 3)', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks (Pack of 3)', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — boy
    const ach_9to12_boy = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Std 9 to 12', gender: 'boy', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_9to12_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — girl
    const ach_9to12_girl = await SchoolStandard.create({
      school_id: ach._id, class_name: 'Std 9 to 12', gender: 'girl', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(ach._id, ach_9to12_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Liberty / Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    console.log('Inserted: Achiever School');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHOOL 4: RADIANT SCHOOL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const rad = await School.create({
      name: 'Radiant School',
      area: 'Sargiasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      is_active: true
    });

    // Nursery/KG — boy (unisex items, separate standard row)
    const rad_nkg_boy = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Nursery/KG', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_nkg_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Half Pant Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Nursery/KG — girl (same items as boy, separate standard row)
    const rad_nkg_girl = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Nursery/KG', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_nkg_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Half Pant Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — boy
    const rad_1to8_boy = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Std 1 to 8', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_1to8_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Full Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — girl
    const rad_1to8_girl = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Std 1 to 8', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_1to8_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Pina Frock', item_type: 'frock', uniform_type: 'regular' },
      { name: 'Belt', item_type: 'belt', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — boy
    const rad_9to12_boy = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Std 9 to 12', gender: 'boy', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_9to12_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — girl
    const rad_9to12_girl = await SchoolStandard.create({
      school_id: rad._id, class_name: 'Std 9 to 12', gender: 'girl', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(rad._id, rad_9to12_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Trouser', item_type: 'trouser', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    console.log('Inserted: Radiant School');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHOOL 5: AMBA SCHOOL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const amba = await School.create({
      name: 'Amba School',
      area: 'Sargiasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      is_active: true
    });

    // Nursery/KG — boy
    const amba_nkg_boy = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Nursery/KG', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_nkg_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Half Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Nursery/KG — girl
    const amba_nkg_girl = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Nursery/KG', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_nkg_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Half Pant', item_type: 'pant', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — boy
    const amba_1to8_boy = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Std 1 to 8', gender: 'boy', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_1to8_boy._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 1 to 8 — girl
    const amba_1to8_girl = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Std 1 to 8', gender: 'girl', division: 'primary', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_1to8_girl._id, [
      { name: 'T-Shirt', item_type: 't-shirt', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — boy
    const amba_9to12_boy = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Std 9 to 12', gender: 'boy', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_9to12_boy._id, [
      { name: 'Shirt', item_type: 'shirt', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    // Std 9 to 12 — girl
    const amba_9to12_girl = await SchoolStandard.create({
      school_id: amba._id, class_name: 'Std 9 to 12', gender: 'girl', division: 'higher', is_active: true
    });
    res = await createProductsForStandard(amba._id, amba_9to12_girl._id, [
      { name: 'Top', item_type: 'top', uniform_type: 'regular' },
      { name: 'Denim', item_type: 'denim', uniform_type: 'regular' },
      { name: 'Socks', item_type: 'socks', uniform_type: 'regular' },
      { name: 'Lakhani Shoes', item_type: 'shoes', uniform_type: 'regular' },
      { name: 'Sports T-Shirt', item_type: 't-shirt', uniform_type: 'sports' },
      { name: 'Sports Track', item_type: 'track', uniform_type: 'sports' }
    ]);
    totalProducts += res.productCount; totalVariants += res.variantCount; totalStandards++;

    console.log('Inserted: Amba School');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ACCESSORIES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await Accessory.insertMany([
      { name: 'School Bag', category: 'bag', price_paisa: 0, image_url: null, is_active: true },
      { name: 'Lunch Box', category: 'lunchbox', price_paisa: 0, image_url: null, is_active: true },
      { name: 'Water Bottle', category: 'bottle', price_paisa: 0, image_url: null, is_active: true },
      { name: 'Undergarments', category: 'innerwear', price_paisa: 0, image_url: null, is_active: true }
    ]);
    console.log('Inserted: Accessories\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FINAL SUMMARY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const schools = await School.countDocuments();
    const standards = await SchoolStandard.countDocuments();
    const products = await Product.countDocuments();
    const variants = await ProductVariant.countDocuments();
    const accessories = await Accessory.countDocuments();

    console.log('=== SEED COMPLETE ===');
    console.log('Schools inserted:', schools);
    console.log('Standards inserted:', standards);
    console.log('Products inserted:', products);
    console.log('Variants inserted:', variants);
    console.log('Accessories inserted:', accessories);
    console.log('Expected schools: 5');
    console.log('Expected standards: 26');
    console.log('Expected products: ~140');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDB();
