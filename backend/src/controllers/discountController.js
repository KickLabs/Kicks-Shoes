import Discount from '../models/Discount.js';

// Get all discounts
const getAllDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, product } = req.query;
    const query = {};

    if (category) {
      query.applicableCategories = category;
    }

    if (product) {
      query.applicableProducts = product;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    // Get all discounts and update their status
    const discounts = await Discount.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort)
      .populate('applicableProducts', 'name price')
      .populate('applicableCategories', 'name');

    // Update status for each discount
    for (let discount of discounts) {
      const oldStatus = discount.status;
      const newStatus = discount.updateStatus();
      if (oldStatus !== newStatus) {
        await discount.save();
      }
    }

    const total = await Discount.countDocuments(query);

    res.status(200).json({
      success: true,
      data: discounts,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching discounts',
      error: error.message,
    });
  }
};

// Get single discount by ID
const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('applicableProducts', 'name price')
      .populate('applicableCategories', 'name');

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching discount',
      error: error.message,
    });
  }
};

// Create new discount
const createDiscount = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      maxDiscount,
      startDate,
      endDate,
      minPurchase,
      usageLimit,
      applicableProducts,
      applicableCategories,
      status,
      usedCount,
    } = req.body;

    // Check if discount code already exists
    const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists',
      });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      description,
      type,
      value,
      maxDiscount,
      startDate,
      endDate,
      minPurchase,
      usageLimit,
      usedCount: usedCount || 0,
      status: status || 'active',
      applicableProducts,
      applicableCategories,
    });

    // Populate references for response
    await discount.populate('applicableProducts', 'name price');
    await discount.populate('applicableCategories', 'name');

    res.status(201).json({
      success: true,
      data: discount,
      message: 'Discount created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating discount',
      error: error.message,
    });
  }
};

// Update discount
const updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    // Define updatable fields (excluding 'type')
    const updatableFields = [
      'description',
      'value',
      'maxDiscount',
      'startDate',
      'endDate',
      'minPurchase',
      'usageLimit',
      'applicableProducts',
      'applicableCategories',
    ];

    // Check if type is being updated
    if (req.body.type && req.body.type !== discount.type) {
      return res.status(400).json({
        success: false,
        message: 'Discount type cannot be modified after creation',
      });
    }

    // Update allowed fields
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        discount[field] = req.body[field];
      }
    });

    // Status will be automatically updated in pre-save middleware
    const updatedDiscount = await discount.save();
    await updatedDiscount.populate('applicableProducts', 'name price');
    await updatedDiscount.populate('applicableCategories', 'name');

    res.status(200).json({
      success: true,
      data: updatedDiscount,
      message: 'Discount updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating discount',
      error: error.message,
    });
  }
};

// Delete discount
const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    await discount.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting discount',
      error: error.message,
    });
  }
};

// Get active discounts (public endpoint)
const getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
      source: { $ne: 'reward_points' }, // ❌ Loại bỏ discount từ reward points
    })
      .select('code description type value minPurchase maxDiscount startDate endDate source')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active discounts',
      error: error.message,
    });
  }
};

// Validate discount code for cart
const validateDiscountCode = async (req, res) => {
  try {
    const { code, cartTotal, cartItems = [] } = req.body;
    const userId = req.user?._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required',
      });
    }

    const discount = await Discount.findOne({ code: code.toUpperCase() });

    if (!discount) {
      return res.status(400).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    // Check if discount is valid
    if (!discount.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is expired or inactive',
      });
    }

    // ✅ Check if user has collected this discount and its status (if user is logged in)
    if (userId) {
      console.log('🔍 Checking UserDiscount for userId:', userId, 'discountId:', discount._id);
      const UserDiscount = (await import('../models/UserDiscount.js')).default;
      const userDiscount = await UserDiscount.findOne({
        user: userId,
        discount: discount._id,
      });

      console.log(
        '📦 UserDiscount found:',
        userDiscount
          ? {
              id: userDiscount._id,
              status: userDiscount.status,
              usedAt: userDiscount.usedAt,
            }
          : 'Not found'
      );

      if (userDiscount) {
        // If user has this discount, it must be 'saved' (not 'used' or 'expired')
        if (userDiscount.status === 'used') {
          console.log('❌ BLOCKED: Voucher already used');
          return res.status(400).json({
            success: false,
            message: 'You have already used this voucher',
          });
        }

        if (userDiscount.status === 'expired') {
          console.log('❌ BLOCKED: Voucher expired');
          return res.status(400).json({
            success: false,
            message: 'This voucher has expired',
          });
        }

        if (userDiscount.status !== 'saved') {
          console.log('❌ BLOCKED: Voucher status is not saved:', userDiscount.status);
          return res.status(400).json({
            success: false,
            message: 'This voucher is not available',
          });
        }
      }
    } else {
      console.log('⚠️ No userId found, skipping UserDiscount validation');
    }

    // Check minimum purchase amount
    if (cartTotal < discount.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ${discount.minPurchase.toLocaleString()} VND required`,
      });
    }

    // Check if user has already used this discount in completed orders (if user is logged in)
    if (userId) {
      const Order = (await import('../models/Order.js')).default;
      const userUsageCount = await Order.countDocuments({
        user: userId,
        discountCode: discount.code,
        status: { $in: ['delivered', 'processing', 'shipped'] },
      });

      if (userUsageCount >= discount.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this discount code',
        });
      }
    }

    // Check if discount has reached usage limit
    if (discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Discount code usage limit reached',
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      discountAmount = Math.min(discount.value, cartTotal);
    }

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        discountAmount,
        discount: {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          description: discount.description,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating discount code',
      error: error.message,
    });
  }
};

// Check if discount is valid
const validateDiscount = async (req, res) => {
  try {
    const { code } = req.params;
    const discount = await Discount.findOne({ code: code.toUpperCase() });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    const isValid = discount.isValid();

    res.status(200).json({
      success: true,
      data: {
        isValid,
        discount: isValid ? discount : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating discount',
      error: error.message,
    });
  }
};

export {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
  getActiveDiscounts,
  validateDiscountCode,
};
