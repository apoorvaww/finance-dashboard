const userService = require('../services/userService');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, role, status } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, status });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: 'User updated.', data: user });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, update, remove };
