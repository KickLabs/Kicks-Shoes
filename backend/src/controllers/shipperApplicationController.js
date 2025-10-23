/**
 * @fileoverview Shipper Application Controller
 * @created 2025-10-22
 * @file shipperApplicationController.js
 */

import ShipperApplication from '../models/ShipperApplication.js';
import User from '../models/User.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

/**
 * Create a new shipper application
 * @route   POST /api/shipper-applications
 * @access  Private/Customer
 */
export const createApplication = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { fullName, phone, email, address, identityCard, vehicleType, vehiclePlate, experience, reason } = req.body;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return next(new ErrorResponse('Only customers can apply to become shippers', 400));
    }

    // Check if user already has a pending application
    const existingPending = await ShipperApplication.findOne({
      user: userId,
      status: 'pending',
    });

    if (existingPending) {
      return next(new ErrorResponse('You already have a pending application', 400));
    }

    // Check if user is already a shipper
    if (req.user.role === 'shipper') {
      return next(new ErrorResponse('You are already a shipper', 400));
    }

    // Create application
    const application = await ShipperApplication.create({
      user: userId,
      fullName,
      phone,
      email,
      address,
      identityCard,
      vehicleType,
      vehiclePlate,
      experience,
      reason,
    });

    logger.info('Shipper application created', {
      applicationId: application._id,
      userId,
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    logger.error('Error creating shipper application:', error);
    next(error);
  }
};

/**
 * Get all shipper applications
 * @route   GET /api/shipper-applications
 * @access  Private/Shop/Admin
 */
export const getAllApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const applications = await ShipperApplication.find(query)
      .populate('user', 'fullName email phone avatar')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ShipperApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting shipper applications:', error);
    next(error);
  }
};

/**
 * Get application by ID
 * @route   GET /api/shipper-applications/:id
 * @access  Private/Shop/Admin
 */
export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await ShipperApplication.findById(id)
      .populate('user', 'fullName email phone avatar')
      .populate('reviewedBy', 'fullName email');

    if (!application) {
      return next(new ErrorResponse('Application not found', 404));
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error getting application:', error);
    next(error);
  }
};

/**
 * Get current user's applications
 * @route   GET /api/shipper-applications/my-applications
 * @access  Private/Customer
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const applications = await ShipperApplication.find({ user: userId })
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    logger.error('Error getting user applications:', error);
    next(error);
  }
};

/**
 * Approve shipper application
 * @route   POST /api/shipper-applications/:id/approve
 * @access  Private/Shop/Admin
 */
export const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const reviewerId = req.user._id;

    const application = await ShipperApplication.findById(id).populate('user');

    if (!application) {
      return next(new ErrorResponse('Application not found', 404));
    }

    if (application.status !== 'pending') {
      return next(new ErrorResponse('Application has already been reviewed', 400));
    }

    // Update application status
    application.status = 'approved';
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    application.reviewNote = reviewNote;
    await application.save();

    // Update user role to shipper
    const user = await User.findById(application.user._id);
    user.role = 'shipper';
    user.isActive = true; // Activate shipper
    user.isVerified = true; // Verify shipper
    await user.save();

    logger.info('Shipper application approved', {
      applicationId: id,
      userId: application.user._id,
      reviewedBy: reviewerId,
    });

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application approved successfully. User is now a shipper.',
    });
  } catch (error) {
    logger.error('Error approving application:', error);
    next(error);
  }
};

/**
 * Reject shipper application
 * @route   POST /api/shipper-applications/:id/reject
 * @access  Private/Shop/Admin
 */
export const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const reviewerId = req.user._id;

    const application = await ShipperApplication.findById(id);

    if (!application) {
      return next(new ErrorResponse('Application not found', 404));
    }

    if (application.status !== 'pending') {
      return next(new ErrorResponse('Application has already been reviewed', 400));
    }

    // Update application status
    application.status = 'rejected';
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    application.reviewNote = reviewNote || 'Application does not meet requirements';
    await application.save();

    logger.info('Shipper application rejected', {
      applicationId: id,
      userId: application.user,
      reviewedBy: reviewerId,
    });

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application rejected',
    });
  } catch (error) {
    logger.error('Error rejecting application:', error);
    next(error);
  }
};

/**
 * Get application statistics
 * @route   GET /api/shipper-applications/stats
 * @access  Private/Shop/Admin
 */
export const getApplicationStats = async (req, res, next) => {
  try {
    const stats = await ShipperApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting application stats:', error);
    next(error);
  }
};

