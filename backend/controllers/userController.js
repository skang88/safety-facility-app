// controllers/userController.js
const User = require('../models/userModel');
const LoginHistory = require('../models/loginHistoryModel');
const bcrypt = require('bcryptjs');
const getMssqlPool = require('../config/mssqlConfig');

// --- 내 프로필 정보 조회 (GET /api/users/profile) ---
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -passwordResetToken -passwordResetExpires');
    
    let teamName = '';
    let deptId = '';
    if (user.employeeId) {
        try {
            const pool = await getMssqlPool();
            const result = await pool.request()
                .input('empId', user.employeeId)
                .query(`
                    SELECT TOP 1 S.ASILN, A.SOSOK
                    FROM COM_AKMSTRP A
                    LEFT JOIN COM_ASOSKRP S ON A.SOSOK = S.ASOSK
                    WHERE A.SABUN = @empId
                    ORDER BY S.ADATE DESC
                `);
            
            if (result.recordset.length > 0) {
                teamName = result.recordset[0].ASILN;
                deptId = result.recordset[0].SOSOK ? result.recordset[0].SOSOK.trim() : '';
            }
        } catch (mssqlError) {
            console.error('MSSQL Team Fetch Error (Profile):', mssqlError);
        }
    }

    if (user) {
      res.status(200).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        licensePlates: user.licensePlates,
        role: user.role,
        employeeId: user.employeeId,
        team: teamName, 
        deptId: deptId
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 내 프로필 정보 업데이트 (PUT /api/users/profile) ---
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { name, phone, password, licensePlates } = req.body;

      user.name = name !== undefined ? name : user.name;
      user.phone = phone !== undefined ? phone : user.phone;

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      if (Array.isArray(licensePlates)) {
          const uniquePlates = Array.from(new Set(
              licensePlates.map(plate => (typeof plate === 'string' ? plate.trim().toUpperCase() : null))
              .filter(plate => plate && plate.length > 0)
          ));
          user.licensePlates = uniquePlates;
      }

      await user.save();

      res.status(200).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        licensePlates: user.licensePlates,
        message: 'Profile updated successfully!'
      });

    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update User Profile Error:', error);
    if (error.code === 11000) {
        return res.status(400).json({ message: 'One or more license plates are already registered.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};


// --- Admin Functions ---

// @desc    Get all users by admin
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, team } = req.query;
    
    let filter = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') filter.isActive = status === 'active';

    const users = await User.find(filter).select('-password').lean();

    const employeeIds = users
        .map(u => u.employeeId)
        .filter(id => id);

    let employeeTeamMap = {};

    if (employeeIds.length > 0) {
        try {
            const pool = await getMssqlPool();
            const idsList = employeeIds.map(id => `'${id}'`).join(',');
            
            const query = `
                SELECT A.SABUN AS ASABN, S.ASILN
                FROM COM_AKMSTRP A
                LEFT JOIN COM_ASOSKRP S ON A.SOSOK = S.ASOSK
                WHERE A.SABUN IN (${idsList})
                AND S.ADATE = (
                    SELECT MAX(ADATE) 
                    FROM COM_ASOSKRP 
                    WHERE ASOSK = S.ASOSK AND (ADATE <= CONVERT(VARCHAR, GETDATE(), 112) OR ADATE = '00000000')
                )
            `;

            const result = await pool.query(query);
            result.recordset.forEach(row => {
                employeeTeamMap[row.ASABN] = row.ASILN;
            });

        } catch (mssqlError) {
            console.error('MSSQL Team Fetch Error (All Users):', mssqlError);
        }
    }

    const normalizedMap = {};
    Object.keys(employeeTeamMap).forEach(key => {
        if (key) normalizedMap[key.toUpperCase()] = employeeTeamMap[key];
    });

    let usersWithTeam = users.map(user => ({
        ...user,
        team: user.employeeId ? (normalizedMap[user.employeeId.toUpperCase()] || '') : ''
    }));

    if (team && team !== 'ALL') {
        usersWithTeam = usersWithTeam.filter(u => u.team === team);
    }

    res.status(200).json(usersWithTeam);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID by admin
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const { name, phone, licensePlates, role, isActive, employeeId } = req.body;

      user.name = name !== undefined ? name : user.name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.role = role !== undefined ? role : user.role;
      user.isActive = isActive !== undefined ? isActive : user.isActive;
      
      if (employeeId !== undefined) {
          user.employeeId = employeeId;
      }

      if (Array.isArray(licensePlates)) {
        const uniquePlates = Array.from(new Set(
            licensePlates.map(plate => (typeof plate === 'string' ? plate.trim().toUpperCase() : null))
            .filter(plate => plate && plate.length > 0)
        ));
        user.licensePlates = uniquePlates;
      }

      const updatedUser = await user.save();

      let teamName = '';
      if (updatedUser.employeeId) {
        try {
          const pool = await getMssqlPool();
          const teamResult = await pool.request()
            .input('empId', updatedUser.employeeId)
            .query(`
                SELECT TOP 1 S.ASILN
                FROM COM_AKMSTRP A
                LEFT JOIN COM_ASOSKRP S ON A.SOSOK = S.ASOSK
                WHERE A.SABUN = @empId
                AND S.ADATE = (
                    SELECT MAX(ADATE) 
                    FROM COM_ASOSKRP 
                    WHERE ASOSK = S.ASOSK AND (ADATE <= CONVERT(VARCHAR, GETDATE(), 112) OR ADATE = '00000000')
                )
            `);
          if (teamResult.recordset.length > 0) {
            teamName = teamResult.recordset[0].ASILN;
          }
        } catch (err) {
          console.error('MSSQL Team Fetch Error (Update):', err);
        }
      }

      res.status(200).json({
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        employeeId: updatedUser.employeeId,
        licensePlates: updatedUser.licensePlates,
        team: teamName
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update User Error:', error);
    if (error.code === 11000) {
        return res.status(400).json({ message: 'One or more license plates are already registered.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get login history by admin
// @route   GET /api/users/login-history
// @access  Private/Admin
exports.getLoginHistory = async (req, res) => {
  try {
    const { email, startDate, endDate } = req.query;
    let query = {};

    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (startDate || endDate) {
      query.loginAt = {};
      if (startDate) query.loginAt.$gte = new Date(startDate);
      if (endDate) query.loginAt.$lte = new Date(endDate);
    }

    const history = await LoginHistory.find(query)
      .populate('user', 'name role employeeId')
      .sort({ loginAt: -1 })
      .limit(500);

    res.status(200).json(history);
  } catch (error) {
    console.error('Get Login History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get login frequency by user
// @route   GET /api/users/login-frequency
// @access  Private/Admin
exports.getLoginFrequency = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.loginAt = {};
      if (startDate) query.loginAt.$gte = new Date(startDate);
      if (endDate) query.loginAt.$lte = new Date(endDate);
    }

    const frequency = await LoginHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user",
          email: { $first: "$email" },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          email: 1,
          count: 1,
          name: "$userDetails.name",
          employeeId: "$userDetails.employeeId",
          role: "$userDetails.role"
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(frequency);
  } catch (error) {
    console.error('Get Login Frequency Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
