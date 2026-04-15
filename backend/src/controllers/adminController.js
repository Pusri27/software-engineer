// Admin Controller
// Handles: employee management operations

const User = require('../models/User');
const WorkLog = require('../models/WorkLog');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/passwordValidator');

const ALLOWED_DOMAINS_REGEX = /@(gmail\.com|yahoo\.com)$/i;

module.exports = {
  // Add Employee
  addEmployee: async (req, res) => {
    // POST /api/admin/employees - Tambah data pegawai
    const { email, password, name, division, role } = req.body;
    try {
      // Validasi input
      if(!email || !password || !name || !division){
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Please provide email, password, name, and division'
        });
      }

      // Validasi domain email
      if(!ALLOWED_DOMAINS_REGEX.test(email)){
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_EMAIL_DOMAIN',
          message: 'Email domain is not allowed. Use gmail or yahoo only.'
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: 'error',
          code: 'WEAK_PASSWORD',
          message: passwordValidation.message
        });
      }

      // Cek user sudah ada
      let user = await User.findOne({email});
      if(user){
        return res.status(400).json({
          status: 'error',
          code: 'USER_EXISTS',
          message: 'User already exists with this email'
        });
      }

      // Buat user baru
      user = new User({
        email,
        password,
        name,
        division,
        role: role || 'user'
      });

      await user.save();

      res.status(201).json({
        status: 'success',
        message: 'Employee added successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          join_date: user.join_date
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to add employee'
      });
    }
  },

  // Edit Employee
  editEmployee: async (req, res) => {
    // PUT /api/admin/employees/:id - Edit data pegawai
    const { id } = req.params;
    const { email, name, division, role, join_date } = req.body;
    try {
      let user = await User.findById(id);
      if(!user){
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Employee not found'
        });
      }

      // Validasi domain email jika email diubah dan tidak kosong
      if(email && email.trim() !== '' && !ALLOWED_DOMAINS_REGEX.test(email)){
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_EMAIL_DOMAIN',
          message: 'Email domain is not allowed. Use gmail or yahoo only.'
        });
      }

      // Update fields
      if(email && email.trim() !== '') user.email = email;
      if(name) user.name = name;
      if(division) user.division = division;
      if(role) user.role = role;
      if(join_date) user.join_date = join_date;

      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Employee updated successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          join_date: user.join_date
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to edit employee'
      });
    }
  },

  // Delete Employee
  deleteEmployee: async (req, res) => {
    // DELETE /api/admin/employees/:id - Hapus pegawai
    const { id } = req.params;
    try {
      const user = await User.findByIdAndDelete(id);
      if(!user){
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to delete employee'
      });
    }
  },

  // Get Employees
  getEmployees: async (req, res) => {
    // GET /api/admin/employees - List pegawai
    const { page = 1, limit = 100, search = '' } = req.query;
    try {
      const skip = (page - 1) * limit;
      
      // Build search filter
      let filter = {};
      if (search) {
        // Split search query by space to support multiple keywords
        const keywords = search.trim().split(/\s+/);
        
        // Build AND conditions for all keywords
        // Each keyword must match at least one field (name, email, or division)
        filter = {
          $and: keywords.map(keyword => ({
            $or: [
              { name: { $regex: keyword, $options: 'i' } },
              { email: { $regex: keyword, $options: 'i' } },
              { division: { $regex: keyword, $options: 'i' } }
            ]
          }))
        };
      }
      
      const users = await User.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

      const total = await User.countDocuments(filter);

      res.status(200).json({
        status: 'success',
        message: 'Employees retrieved successfully',
        data: users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve employees'
      });
    }
  },

  // Toggle Employee Active Status (Block/Unblock)
  toggleEmployeeStatus: async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.findById(id);
      if(!user){
        return res.status(404).json({
          status: 'error', code: 'NOT_FOUND', message: 'Employee not found'
        });
      }
      user.isActive = !user.isActive;
      await user.save();
      res.status(200).json({
        status: 'success',
        message: user.isActive ? 'User unblocked successfully' : 'User blocked successfully',
        data: { id: user._id, name: user.name, email: user.email, isActive: user.isActive }
      });
    } catch (error) {
      return res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Failed to toggle user status' });
    }
  },

  // GET /api/admin/analytics — division & team analytics
  getAnalytics: async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Total stats
      const totalUsers = await User.countDocuments();
      const totalWorklogs = await WorkLog.countDocuments();

      // Worklogs per division (all time)
      const divisionAgg = await WorkLog.aggregate([
        {
          $lookup: {
            from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo',
            pipeline: [{ $project: { division: 1 } }]
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$userInfo.division', 'Unknown'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $project: { division: '$_id', count: 1, _id: 0 } }
      ]);

      // Top 5 contributors (last 30 days)
      const topContributors = await WorkLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo',
            pipeline: [{ $project: { name: 1, division: 1, profile_photo: 1 } }]
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            count: 1,
            name: '$userInfo.name',
            division: '$userInfo.division',
            photo: '$userInfo.profile_photo',
          }
        }
      ]);

      // Daily activity — last 7 days
      const allRecent = await WorkLog.find({ createdAt: { $gte: sevenDaysAgo } })
        .select('createdAt')
        .lean();

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const dailyActivity = days.map(day => {
        const label = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const count = allRecent.filter(log => {
          const ld = new Date(log.createdAt);
          return ld.getFullYear() === day.getFullYear() &&
            ld.getMonth() === day.getMonth() &&
            ld.getDate() === day.getDate();
        }).length;
        return { date: label, count };
      });

      const totalDivisions = divisionAgg.length;
      const avgPerUser = totalUsers > 0 ? Math.round((totalWorklogs / totalUsers) * 10) / 10 : 0;

      res.json({
        totalStats: { totalUsers, totalWorklogs, totalDivisions, avgPerUser },
        worklogsPerDivision: divisionAgg,
        topContributors,
        dailyActivity,
      });
    } catch (err) {
      console.error('❌ getAnalytics error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
};
