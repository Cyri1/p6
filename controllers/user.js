const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

//réception d'une demande de création de compte (post)
exports.signup = (req, res, next) => {
    //hash du password avec bcrypt
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            //sauvegarde dans la bdd de l'email / et du hash password
            user.save()
                .then(() => res.status(201).json({
                    message: 'Utilisateur créé !'
                }))
                .catch(error => res.status(400).json({
                    error
                }));
        })
        .catch(error => res.status(500).json({
            error
        }));
};

//reception d'une demande de login (post)
exports.login = (req, res, next) => {
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            //si l'email recut n'existe pas
            if (!user) {
                return res.status(401).json({
                    error: 'Identifiants incorrects!'
                })
            }
            // vérification si le mot de passe hashé entré correspond au mot de passe hashé dans la bdd
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({
                            error: 'Identifiants incorrects!'
                        })
                    }
                    res.status(200).json({
                        //si oui création d'un token avec json web token et la clé secrete
                        userId: user._id,
                        token: jwt.sign({
                                userId: user._id
                            },
                            'RANDOM_TOKEN_SECRET', {
                                expiresIn: '24h'
                            }
                        )
                    });
                })
                .catch(error => res.status(500).json({
                    error
                }));
        })
        .catch(error => res.status(500).json({
            error
        }));
};