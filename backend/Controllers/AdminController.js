const UserModel = require('../Models/Users');
const bcrypt = require('bcrypt');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'amar2006@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Amar@2006';

/**
 * Idempotent admin seed — runs on every server boot.
 * Creates the hardcoded admin if it doesn't exist; updates isApproved if it does.
 */
const seedAdmin = async () => {
    try {
        const existing = await UserModel.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            // Ensure admin is always approved regardless of DB state
            if (!existing.isApproved || existing.role !== 'admin') {
                await UserModel.updateOne(
                    { email: ADMIN_EMAIL },
                    { $set: { isApproved: true, role: 'admin' } }
                );
                console.log('Admin account updated.');
            } else {
                console.log('Admin account already exists.');
            }
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await UserModel.create({
                name: 'Admin',
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
                isApproved: true,
            });
            console.log('Default admin created:', ADMIN_EMAIL);
        }
    } catch (err) {
        console.error('Admin seed error:', err);
    }
};


/** GET /api/admin/users — all users pending approval */
const getPendingUsers = async (req, res) => {
    try {
        const users = await UserModel.find(
            { isApproved: false },
            { password: 0 }           // never expose hashed passwords
        ).sort({ createdAt: -1 });

        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


/** PATCH /api/admin/approve/:id — approve a specific user */
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndUpdate(
            id,
            { $set: { isApproved: true } },
            { new: true, select: '-password' }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        res.status(200).json({ message: `${user.name} approved successfully`, success: true, user });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


/** PATCH /api/admin/reject/:id — remove a pending user */
const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        res.status(200).json({ message: `${user.name}'s account rejected and removed`, success: true });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


module.exports = { seedAdmin, getPendingUsers, approveUser, rejectUser };
