const Sauce = require('../models/Sauce')
const fs = require('fs')


//aller chercher l'ensemble des données des sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({
      error
    }))
}

//aller chercher les données de la sauce correspondant à l'id
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
      _id: req.params.id
    })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({
      error
    }))
}

//inserer dans la base de données une nouvelle sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce)
  delete sauceObject._id

  //création d'un objet Sauce contenant l'ensemble des infos contenues dans req.body.sauce
  const sauce = new Sauce({
    ...sauceObject,
    // enregistrement de l'url de l'image correspondant à la sauce
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  //envoie vers mongoDB
  sauce.save()
    .then(() => res.status(201).json({
      message: 'Objet enregistré !'
    }))
    .catch(error => res.status(400).json({
      error
    }))
};

//modif d'une sauce
exports.modifySauce = (req, res, next) => {

  //si req.file existe on modifie l'url image
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : {
      //si pas de req.file
    ...req.body
  }

  //update de la bdd
  Sauce.updateOne({
      _id: req.params.id
    }, {
      ...sauceObject,
      _id: req.params.id
    })
    .then(() => res.status(200).json({
      message: 'Objet modifié !'
    }))
    .catch(error => res.status(400).json({
      error
    }));
};

//supression de la sauce correspondant à l'id req.params.id
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({
      _id: req.params.id
    })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1]
      //suppression du fichier image correspondant
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({
            _id: req.params.id
          })
          .then(() => res.status(200).json({
            message: 'Objet supprimé !'
          }))
          .catch(error => res.status(400).json({
            error
          }))
      })
    })
    .catch(error => res.status(500).json({
      error
    }))
}

exports.voteSauce = (req, res, next) => {
  //si req.body.like = 1 alors -> +1 ($inc) à la colonne likes de mongodb et ajout du userId au tableau usersLiked
  if (req.body.like === 1) {
    Sauce.updateOne({
        _id: req.params.id
      }, {
        $inc: {
          likes: req.body.like
        },
        $push: {
          usersLiked: req.body.userId
        }
      })
      .then(() => res.status(200).json({
        message: 'Vote up'
      }))
      .catch(error => res.status(400).json({
        error
      }))
    //si req.body.like = -1 alors -> +1 ($inc) à la colonne dislikes de mongodb et ajout du userId au tableau usersDisliked
  } else if (req.body.like === -1) {
    Sauce.updateOne({
        _id: req.params.id
      }, {
        $inc: {
          //on reçoit -1 du frontend donc -1*-1 = 1
          dislikes: (req.body.like * -1) 
        },
        $push: {
          usersDisliked: req.body.userId
        }
      })
      .then(() => res.status(200).json({
        message: 'Vote down'
      }))
      .catch(error => res.status(400).json({
        error
      }))
  } else if (req.body.like === 0) {
        //si req.body.like = 0 alors on supprime l'utilisateur du tableau dans lequel il était (usersLiked ou usersDisliked) et on fait -1 à la colonne likes/dislikes
    Sauce.findOne({
        _id: req.params.id
      })
      .then(sauce => {
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne({
              _id: req.params.id
            }, {
              $pull: {
                usersLiked: req.body.userId
              },
              $inc: {
                likes: -1
              }
            })
            .then(() => {
              res.status(200).json({
                message: 'Delete like'
              })
            })
            .catch(error => res.status(400).json({
              error
            }))
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne({
              _id: req.params.id
            }, {
              $pull: {
                usersDisliked: req.body.userId
              },
              $inc: {
                dislikes: -1
              }
            })
            .then(() => {
              res.status(200).json({
                message: 'Delete dislike'
              })
            })
            .catch(error => res.status(400).json({
              error
            }))
        }
      })
      .catch(error => res.status(400).json({
        error
      }))
  }
};