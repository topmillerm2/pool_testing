const User = require('../models/user');
const jwt = require('jwt-simple');
const config = require('../config');

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
}

exports.signin = function(req, res, next) {
  res.send({ token: tokenForUser(req.user), user: req.user });
};

exports.signup = function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res
      .status(422)
      .send({ error: 'You must provide an email and password' });
  }

  User.findOne({ email: email }, function(err, existingUser) {
    if (err) {
      return next(err);
    }

    if (existingUser) {
      return res.status(422).send({ error: 'Email is already in use' });
    }
    const user = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      dob: req.body.dob,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.phone,
      savingsQ: req.body.savingsQ,
      incomeQ: req.body.incomeQ,
      email: email,
      password: password
    });

    user.save(err => {
      if (err) {
        return next(err);
      }
      res.send({ token: tokenForUser(user), user });
    });
  });
};

exports.update = async (req, res, done) => {
	console.log(req.body)
  console.log(parseInt(req.body.amount), typeof req.body.amount);
  console.log(req.user.usedAmount, typeof req.user.usedAmount);
  console.log(req.user.mlimit, typeof req.user.mlimit);
	const amount = parseInt(req.body.amount);
	console.log(amount)

  if (amount + req.user.usedAmount < req.user.mlimit) {
    console.log('updating');
    req.user.usedAmount += amount;
    const user = await req.user.save();
    res.send(user);
  } else {
    return res
      .status(422)
      .send({ error: 'Participating in this pool exceeds your limit' });
  }
};
