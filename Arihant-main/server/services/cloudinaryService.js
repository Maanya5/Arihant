const cloudinary = require('../config/cloudinary');

/**
 * Upload a remote image URL directly to Cloudinary.
 * Cloudinary supports fetching from URL natively — no download needed.
 */
const uploadUrlToCloudinary = async (
  imageUrl,
  folder = 'uniform-store/products',
  publicId = null
) => {
  try {
    const uploadOptions = {
      folder,
      transformation: [
        { width: 800, height: 800, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      overwrite: true
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error.message);
    return null;
  }
};

/**
 * Upload multiple image URLs to Cloudinary for a single product.
 * Uses Promise.allSettled so one failure doesn't block others.
 */
const uploadMultipleToCloudinary = async (imageUrls, productId) => {
  const uploadPromises = imageUrls.map((url, index) =>
    uploadUrlToCloudinary(
      url,
      'uniform-store/products',
      `product_${productId}_img_${index + 1}`
    )
  );

  const results = await Promise.allSettled(uploadPromises);

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
};

module.exports = {
  uploadUrlToCloudinary,
  uploadMultipleToCloudinary
};
