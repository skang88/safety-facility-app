const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

async function seedUsers() {
  try {
    const defaultUsers = [
      {
        email: 'user_uryeong',
        employeeId: 'USER_URYEONG',
        password: 'pass1234',
        name: '의령센터 담당자',
        role: 'center_user',
        center: '의령'
      },
      {
        email: 'user_burim',
        employeeId: 'USER_BURIM',
        password: 'pass1234',
        name: '부림센터 담당자',
        role: 'center_user',
        center: '부림'
      },
      {
        email: 'user_jeonggok',
        employeeId: 'USER_JEONGGOK',
        password: 'pass1234',
        name: '정곡센터 담당자',
        role: 'center_user',
        center: '정곡'
      },
      {
        email: 'approver_uryeong',
        employeeId: 'APPROVER_URYEONG',
        password: 'pass1234',
        name: '의령센터장(승인자)',
        role: 'center_approver',
        center: '의령'
      },
      {
        email: 'admin_station',
        employeeId: 'ADMIN_STATION',
        password: 'pass1234',
        name: '의령소방서 관리자',
        role: 'station_admin',
        center: '의령소방서'
      },
      {
        email: 'admin_hq',
        employeeId: 'ADMIN_HQ',
        password: 'pass1234',
        name: '소방본부 관리자',
        role: 'hq_admin',
        center: '소방본부'
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ 
        $or: [{ email: u.email }, { employeeId: u.employeeId }] 
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await User.create({
          email: u.email,
          employeeId: u.employeeId,
          password: hashedPassword,
          name: u.name,
          role: u.role,
          center: u.center,
          isVerified: true,
          isActive: true
        });
        console.log(`[UserSeed] Created account: ${u.name} (${u.employeeId})`);
      } else {
        // Ensure email, role, center & isVerified are up-to-date
        existing.email = u.email;
        existing.role = u.role;
        existing.center = u.center;
        existing.isVerified = true;
        existing.isActive = true;
        await existing.save();
        console.log(`[UserSeed] Updated account email to plain ID: ${u.email}`);
      }
    }
  } catch (error) {
    console.error('[UserSeed] Error seeding default accounts:', error);
  }
}

module.exports = seedUsers;
