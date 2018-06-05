const jwt = require('jsonwebtoken');

module.exports = {
  createToken: (user) => {
    console.log(user);
    const data = {
      id: user.id,
      username: user.blockstackUsername,
    };

    const tokenOptions = {
      algorithm: 'HS256',
    };

    return jwt.sign({ data }, process.env.JWT_SECRET, tokenOptions);
  },
};
