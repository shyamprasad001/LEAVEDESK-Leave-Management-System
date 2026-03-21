const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// Auth middleware
const isHOD = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please login to continue');
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'hod') {
    return res.redirect('/faculty/dashboard');
  }
  next();
};

// Dashboard
router.get('/dashboard', isHOD, async (req, res) => {
  try {
    const dept = req.session.user.department;
    const recentLeaves = await LeaveRequest.find({ department: dept })
      .populate('faculty', 'name employeeId designation')
      .sort({ createdAt: -1 }).limit(6);

    const stats = {
      total: await LeaveRequest.countDocuments({ department: dept }),
      pending: await LeaveRequest.countDocuments({ department: dept, status: 'Pending' }),
      approved: await LeaveRequest.countDocuments({ department: dept, status: 'Approved' }),
      rejected: await LeaveRequest.countDocuments({ department: dept, status: 'Rejected' }),
      totalFaculty: await User.countDocuments({ department: dept, role: 'faculty', isActive: true })
    };

    res.render('hod/dashboard', { title: 'HOD Dashboard', recentLeaves, stats });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/login');
  }
});

// All Leave Requests
router.get('/leave-requests', isHOD, async (req, res) => {
  try {
    const { status, leaveType } = req.query;
    let filter = { department: req.session.user.department };
    if (status && status !== 'all') filter.status = status;
    if (leaveType && leaveType !== 'all') filter.leaveType = leaveType;

    const leaves = await LeaveRequest.find(filter)
      .populate('faculty', 'name employeeId designation')
      .sort({ isUrgent: -1, createdAt: -1 });

    res.render('hod/leave-requests', {
      title: 'Leave Requests',
      leaves,
      currentStatus: status || 'all',
      currentType: leaveType || 'all',
      leaveTypes: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave', 'Study Leave']
    });
  } catch (err) {
    req.flash('error_msg', 'Error loading leave requests');
    res.redirect('/hod/dashboard');
  }
});

// View Leave Detail
router.get('/leave/:id', isHOD, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({ _id: req.params.id, department: req.session.user.department })
      .populate('faculty', 'name email employeeId designation phone department joiningDate')
      .populate('reviewedBy', 'name');
    if (!leave) {
      req.flash('error_msg', 'Leave request not found');
      return res.redirect('/hod/leave-requests');
    }
    res.render('hod/leave-detail', { title: 'Review Leave Request', leave });
  } catch (err) {
    req.flash('error_msg', 'Error loading leave details');
    res.redirect('/hod/leave-requests');
  }
});

// Approve/Reject Leave
router.post('/leave/:id/review', isHOD, async (req, res) => {
  try {
    const { action, hodComment } = req.body;
    const leave = await LeaveRequest.findOne({ _id: req.params.id, department: req.session.user.department });

    if (!leave) {
      req.flash('error_msg', 'Leave request not found');
      return res.redirect('/hod/leave-requests');
    }
    if (leave.status !== 'Pending') {
      req.flash('error_msg', 'This leave request has already been reviewed');
      return res.redirect(`/hod/leave/${req.params.id}`);
    }

    leave.status = action === 'approve' ? 'Approved' : 'Rejected';
    leave.hodComment = hodComment;
    leave.reviewedBy = req.session.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    req.flash('success_msg', `Leave request ${leave.status.toLowerCase()} successfully`);
    res.redirect('/hod/leave-requests');
  } catch (err) {
    req.flash('error_msg', 'Error reviewing leave request');
    res.redirect('/hod/leave-requests');
  }
});

// Faculty List
router.get('/faculty', isHOD, async (req, res) => {
  try {
    const facultyList = await User.find({ department: req.session.user.department, role: 'faculty', isActive: true })
      .select('-password').sort({ name: 1 });

    // Get leave count for each faculty
    const facultyWithStats = await Promise.all(facultyList.map(async (f) => {
      const leaveCount = await LeaveRequest.countDocuments({ faculty: f._id });
      const pendingCount = await LeaveRequest.countDocuments({ faculty: f._id, status: 'Pending' });
      return { ...f.toObject(), leaveCount, pendingCount };
    }));

    res.render('hod/faculty-list', { title: 'Faculty Members', facultyList: facultyWithStats });
  } catch (err) {
    req.flash('error_msg', 'Error loading faculty list');
    res.redirect('/hod/dashboard');
  }
});

// Profile
router.get('/profile', isHOD, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    res.render('hod/profile', { title: 'My Profile', profileUser: user });
  } catch (err) {
    req.flash('error_msg', 'Error loading profile');
    res.redirect('/hod/dashboard');
  }
});

module.exports = router;
