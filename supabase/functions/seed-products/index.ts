import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Realistic product data
const productCategories = [
  { name: 'T-Shirts', basePrice: 25 },
  { name: 'Hoodies', basePrice: 65 },
  { name: 'Jeans', basePrice: 85 },
  { name: 'Jackets', basePrice: 120 },
  { name: 'Dresses', basePrice: 95 },
  { name: 'Shirts', basePrice: 55 },
  { name: 'Pants', basePrice: 70 },
  { name: 'Sweaters', basePrice: 80 },
  { name: 'Shorts', basePrice: 40 },
  { name: 'Skirts', basePrice: 60 },
]

const styles = [
  'Classic', 'Modern', 'Vintage', 'Urban', 'Minimalist', 'Bohemian', 
  'Streetwear', 'Elegant', 'Casual', 'Sporty', 'Premium', 'Essential',
  'Signature', 'Heritage', 'Contemporary', 'Artisan', 'Luxe', 'Studio'
]

const adjectives = [
  'Soft', 'Slim', 'Relaxed', 'Tailored', 'Oversized', 'Fitted',
  'Lightweight', 'Heavy', 'Stretch', 'Organic', 'Premium', 'Ultra',
  'Cozy', 'Breathable', 'Durable', 'Flex', 'Pro', 'Elite'
]

const colors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#001F3F' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Dusty Rose', hex: '#DCAE96' },
  { name: 'Slate Blue', hex: '#6A5ACD' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Sage', hex: '#9DC183' },
  { name: 'Mustard', hex: '#FFDB58' },
  { name: 'Coral', hex: '#FF7F50' },
]

const sizes = [
  { label: 'XS', sortOrder: 1 },
  { label: 'S', sortOrder: 2 },
  { label: 'M', sortOrder: 3 },
  { label: 'L', sortOrder: 4 },
  { label: 'XL', sortOrder: 5 },
  { label: 'XXL', sortOrder: 6 },
]

const materials = [
  { name: '100% Cotton', gsm: '180', season: 'All Season' },
  { name: 'Cotton Blend', gsm: '200', season: 'All Season' },
  { name: 'Organic Cotton', gsm: '160', season: 'Summer' },
  { name: 'French Terry', gsm: '280', season: 'Winter' },
  { name: 'Fleece', gsm: '320', season: 'Winter' },
  { name: 'Linen', gsm: '140', season: 'Summer' },
  { name: 'Denim', gsm: '400', season: 'All Season' },
  { name: 'Wool Blend', gsm: '350', season: 'Winter' },
  { name: 'Jersey', gsm: '170', season: 'All Season' },
  { name: 'Modal', gsm: '150', season: 'Summer' },
]

const brands = [
  'LINEA', 'Urban Core', 'Heritage Co.', 'Studio Label', 'Essential Wear',
  'Prime Basics', 'Artisan Collective', 'Modern Thread', 'City Style', 'Pure Form'
]

const productImages = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800',
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
  'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateSKU(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(5, '0')}`
}

function generateDescription(productName: string, category: string): { short: string; full: string } {
  const shortDescriptions = [
    `Premium ${category.toLowerCase()} crafted for everyday comfort and style.`,
    `Elevate your wardrobe with this versatile ${category.toLowerCase()}.`,
    `A must-have ${category.toLowerCase()} designed for modern living.`,
    `Timeless ${category.toLowerCase()} that combines quality with comfort.`,
    `Discover unmatched comfort in this carefully crafted ${category.toLowerCase()}.`,
  ]

  const fullDescriptions = [
    `The ${productName} represents the perfect blend of style and functionality. Made from premium materials, this ${category.toLowerCase()} offers exceptional comfort and durability. Features include reinforced stitching, a flattering fit, and easy-care fabric that maintains its shape wash after wash. Perfect for both casual outings and everyday wear.`,
    `Introducing the ${productName} - a thoughtfully designed piece that elevates any wardrobe. Crafted with attention to detail, this ${category.toLowerCase()} features premium construction, breathable fabric, and a modern silhouette. Whether you're dressing up or keeping it casual, this versatile piece delivers style and comfort in equal measure.`,
    `Experience superior quality with the ${productName}. This ${category.toLowerCase()} combines traditional craftsmanship with contemporary design. The carefully selected fabric ensures all-day comfort, while the refined details add a touch of sophistication. Easy to style and built to last, it's an essential addition to your collection.`,
  ]

  return {
    short: randomElement(shortDescriptions),
    full: randomElement(fullDescriptions),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { productCount = 1000 } = await req.json().catch(() => ({}))
    
    console.log(`Starting seed process for ${productCount} products...`)

    // Step 1: Seed Colors
    console.log('Seeding colors...')
    const colorInserts = colors.map(c => ({ name: c.name, hex_code: c.hex }))
    const { data: insertedColors, error: colorError } = await supabase
      .from('colors')
      .upsert(colorInserts, { onConflict: 'name', ignoreDuplicates: true })
      .select()
    
    if (colorError) {
      console.error('Color insert error:', colorError)
    }
    
    // Fetch all colors
    const { data: allColors } = await supabase.from('colors').select('id, name')
    const colorMap = new Map(allColors?.map(c => [c.name, c.id]) || [])

    // Step 2: Seed Sizes
    console.log('Seeding sizes...')
    const sizeInserts = sizes.map(s => ({ label: s.label, sort_order: s.sortOrder }))
    const { error: sizeError } = await supabase
      .from('sizes')
      .upsert(sizeInserts, { onConflict: 'label', ignoreDuplicates: true })
      .select()
    
    if (sizeError) {
      console.error('Size insert error:', sizeError)
    }

    // Fetch all sizes
    const { data: allSizes } = await supabase.from('sizes').select('id, label')
    const sizeMap = new Map(allSizes?.map(s => [s.label, s.id]) || [])

    // Step 3: Seed Materials
    console.log('Seeding materials...')
    const materialInserts = materials.map(m => ({ name: m.name, gsm: m.gsm, season: m.season }))
    const { error: materialError } = await supabase
      .from('materials')
      .upsert(materialInserts, { onConflict: 'name', ignoreDuplicates: true })
      .select()
    
    if (materialError) {
      console.error('Material insert error:', materialError)
    }

    // Fetch all materials
    const { data: allMaterials } = await supabase.from('materials').select('id, name')
    const materialMap = new Map(allMaterials?.map(m => [m.name, m.id]) || [])

    // Step 4: Seed Brands
    console.log('Seeding brands...')
    const brandInserts = brands.map(b => ({ name: b }))
    const { error: brandError } = await supabase
      .from('brands')
      .upsert(brandInserts, { onConflict: 'name', ignoreDuplicates: true })
      .select()
    
    if (brandError) {
      console.error('Brand insert error:', brandError)
    }

    // Fetch all brands
    const { data: allBrands } = await supabase.from('brands').select('id, name')
    const brandMap = new Map(allBrands?.map(b => [b.name, b.id]) || [])

    // Step 5: Seed Categories
    console.log('Seeding categories...')
    const categoryInserts = productCategories.map(c => ({ name: c.name }))
    const { error: categoryError } = await supabase
      .from('categories')
      .upsert(categoryInserts, { onConflict: 'name', ignoreDuplicates: true })
      .select()
    
    if (categoryError) {
      console.error('Category insert error:', categoryError)
    }

    // Fetch all categories
    const { data: allCategories } = await supabase.from('categories').select('id, name')
    const categoryMap = new Map(allCategories?.map(c => [c.name, c.id]) || [])

    // Step 6: Generate and insert products in batches
    console.log('Generating products...')
    const batchSize = 50
    let productsCreated = 0
    let variantsCreated = 0
    let imagesCreated = 0

    for (let batch = 0; batch < Math.ceil(productCount / batchSize); batch++) {
      const products = []
      const startIdx = batch * batchSize
      const endIdx = Math.min(startIdx + batchSize, productCount)

      for (let i = startIdx; i < endIdx; i++) {
        const category = randomElement(productCategories)
        const style = randomElement(styles)
        const adjective = randomElement(adjectives)
        const brand = randomElement(brands)
        
        const productName = `${style} ${adjective} ${category.name.slice(0, -1)}`
        const descriptions = generateDescription(productName, category.name)
        
        const priceVariation = (Math.random() * 0.4 - 0.2) * category.basePrice
        const basePrice = Math.round(category.basePrice + priceVariation)

        products.push({
          name: productName,
          sku: generateSKU('PRD', i + 1),
          product_type: 'variable' as const,
          category_id: categoryMap.get(category.name),
          brand_id: brandMap.get(brand),
          short_description: descriptions.short,
          full_description: descriptions.full,
          base_price: basePrice,
          is_active: true,
        })
      }

      // Insert products batch
      const { data: insertedProducts, error: productError } = await supabase
        .from('products')
        .insert(products)
        .select('id, base_price')

      if (productError) {
        console.error('Product insert error:', productError)
        continue
      }

      productsCreated += insertedProducts?.length || 0

      // Generate variants and images for each product
      const allVariants = []
      const allImages = []

      for (const product of insertedProducts || []) {
        // Random selection of colors (2-5), sizes (3-6), materials (1-3)
        const selectedColors = [...colors].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 4))
        const selectedSizes = [...sizes].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 4))
        const selectedMaterials = [...materials].sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 3))

        let variantIndex = 0
        for (const color of selectedColors) {
          for (const size of selectedSizes) {
            const material = randomElement(selectedMaterials)
            
            // Price variation based on size and material
            const sizeMultiplier = sizes.findIndex(s => s.label === size.label) * 2
            const materialMultiplier = materials.findIndex(m => m.name === material.name) * 3
            const sellingPrice = product.base_price + sizeMultiplier + materialMultiplier
            const purchasePrice = Math.round(sellingPrice * 0.5)
            
            allVariants.push({
              product_id: product.id,
              color_id: colorMap.get(color.name),
              size_id: sizeMap.get(size.label),
              material_id: materialMap.get(material.name),
              sku: `${product.id.slice(0, 8)}-${variantIndex}`,
              purchase_price: purchasePrice,
              selling_price: sellingPrice,
              stock: 10 + Math.floor(Math.random() * 90),
              available_stock: 10 + Math.floor(Math.random() * 90),
              is_active: Math.random() > 0.1,
            })
            variantIndex++
          }
        }

        // Add 2-4 images per product
        const numImages = 2 + Math.floor(Math.random() * 3)
        for (let imgIdx = 0; imgIdx < numImages; imgIdx++) {
          allImages.push({
            product_id: product.id,
            image_url: randomElement(productImages),
            alt_text: `Product image ${imgIdx + 1}`,
            sort_order: imgIdx,
            is_main: imgIdx === 0,
            color_id: imgIdx === 0 ? null : colorMap.get(randomElement(selectedColors).name),
          })
        }
      }

      // Insert variants in batches
      const variantBatchSize = 500
      for (let v = 0; v < allVariants.length; v += variantBatchSize) {
        const variantBatch = allVariants.slice(v, v + variantBatchSize)
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantBatch)
        
        if (variantError) {
          console.error('Variant insert error:', variantError)
        } else {
          variantsCreated += variantBatch.length
        }
      }

      // Insert images
      const { error: imageError } = await supabase
        .from('product_images')
        .insert(allImages)
      
      if (imageError) {
        console.error('Image insert error:', imageError)
      } else {
        imagesCreated += allImages.length
      }

      console.log(`Batch ${batch + 1}/${Math.ceil(productCount / batchSize)} completed. Products: ${productsCreated}, Variants: ${variantsCreated}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully seeded ${productsCreated} products with ${variantsCreated} variants and ${imagesCreated} images`,
        stats: {
          products: productsCreated,
          variants: variantsCreated,
          images: imagesCreated,
          colors: colorMap.size,
          sizes: sizeMap.size,
          materials: materialMap.size,
          brands: brandMap.size,
          categories: categoryMap.size,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Seed error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
