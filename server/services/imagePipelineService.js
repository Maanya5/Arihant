const { fetchImagesFromUnsplash } = require('./unsplashService');
const { uploadMultipleToCloudinary } = require('./cloudinaryService');

/**
 * Full pipeline: Unsplash → Cloudinary → gallery array for MongoDB
 * 
 * @param {string} itemName - Product name (e.g. "Half Sleeve Shirt")
 * @param {string} productId - MongoDB product _id (used for Cloudinary public_id)
 * @param {number} imageCount - Number of images to fetch (default 4)
 * @returns {Array} Gallery array ready to be saved on the Product document
 */
const fetchAndStoreImages = async (itemName, productId, imageCount = 4) => {
  console.log(`[Pipeline] Starting image fetch for: "${itemName}" (${productId})`);

  // Step 1: Fetch from Unsplash
  const unsplashPhotos = await fetchImagesFromUnsplash(itemName, imageCount);

  if (unsplashPhotos.length === 0) {
    console.log(`[Pipeline] No images found for: "${itemName}"`);
    return [];
  }

  // Step 2: Extract URLs and attribution info
  const photoData = unsplashPhotos.map(photo => ({
    url: photo.urls.regular,
    photographer: photo.user?.name || 'Unknown',
    photographer_url: photo.user?.links?.html || 'https://unsplash.com'
  }));

  // Step 3: Upload all to Cloudinary
  const cloudinaryResults = await uploadMultipleToCloudinary(
    photoData.map(p => p.url),
    productId
  );

  if (cloudinaryResults.length === 0) {
    console.log(`[Pipeline] All Cloudinary uploads failed for: "${itemName}"`);
    return [];
  }

  // Step 4: Combine Cloudinary URLs with Unsplash attribution
  const gallery = cloudinaryResults.map((cloudImg, index) => ({
    url: cloudImg.url,
    public_id: cloudImg.public_id,
    is_primary: index === 0,
    attribution: {
      photographer: photoData[index]?.photographer || 'Unknown',
      photographer_url: photoData[index]?.photographer_url || 'https://unsplash.com',
      source: 'Unsplash'
    }
  }));

  console.log(`[Pipeline] ✅ Stored ${gallery.length} images for: "${itemName}"`);
  return gallery;
};

module.exports = { fetchAndStoreImages };
