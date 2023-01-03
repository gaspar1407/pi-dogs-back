const axios = require("axios");
const { Router, application } = require("express");
const { Op } = require("sequelize");

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const { Temp, Dog } = require("../db");

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//---------------------LLAMADO A LA API---------------------------
const reqApi = async function getApi() {
  const reqApi = await axios.get(`https://api.thedogapi.com/v1/breeds`);
  // console.log(reqApi)
  const componenteInfo = reqApi.data.map((e) => {
    // requiere datos de la API thedogapi.com
    return {
      id: e.id,
      name: e.name,
      height: e.height.metric,
      weight: e.weight.metric,
      life_span: e.life_span,
      image: e.image.url,
      temperament: e.temperament,
    };
  });
  return componenteInfo;
};
//----------------LLAMADO A LA DB----------------------------

const reqDb = async () => {
  return await Dog.findAll({
    include: {
      model: Temp,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });
};

//------------------------GET PRINCIPAL------------------------
router.get("/dogs", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      const api = await reqApi();
      const db = await reqDb();
      /* console.log(db, "este es el redb"); */
      const allInfo = api.concat(db);
      res.status(200).send(allInfo.length ? allInfo : "Info not found");
    }
    if (name) {
      const api = await reqApi();
      // console.log(api)
      const nameQuery = await api.filter((data) =>
        data.name.toLowerCase().includes(name.toLowerCase())
      );
      // console.log(nameQuery)
      const db = await Dog.findAll({
        include: Temp,
        where: {
          name: {
            [Op.iLike]: "%" + name + "%",
            //realiza una consulta parcial a la db sin diferenciar mayusculas y minusculas
          },
        },
      });
      // res.send('name')
      const allInfo = nameQuery.concat(db);
      res.status(200).send(allInfo.length ? allInfo : "Info Dog not found");
    }
  } catch (err) {
    console.log(err);
  }
});

//---------------------GET POR ID-----------------------------
router.get("/dogs/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    if (isNaN(id)) {
      const getDb = await Dog.findByPk(id, {
        //se realiza cuando el id no es numerico
        include: {
          model: Temp,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      });
      res.send(getDb);
    } else {
      let api = await reqApi(undefined); //
      /* console.log(api); */
      const found = api.find((e) => e.id === Number(id));
      found ? res.send(found) : res.status(405).json({ msg: "no existe" });
    }
  } catch (err) {
    next(err);
  }
});

//-----------------------GET TEMPERAMENTOS--------------------
router.get("/temperament", async (req, res) => {
  try {
    const temperamentApi = await axios.get(
      `https://api.thedogapi.com/v1/breeds`
    );
    let temperament = temperamentApi.data.map((d) =>
      d.temperament ? d.temperament : "no se tiene temperamento"
    );
    let temp2 = temperament.map((d) => d.split(", "));
    let settemp = new Set(temp2.flat()); // el set quita los repetidos y el flat los saca del array
    for (el of settemp) {
      if (el)
        await Temp.findOrCreate({
          where: { name: el.toLowerCase() },
        });
    }
    temperamentoBd = await Temp.findAll();
    //console.log(temperamentApi)
    res.status(200).json(temperamentoBd);
  } catch (error) {
    res.status(404).send("No se tiene respuesta a su solicitud" + error);
  }
});

//------------------------POST--------------------------------

router.post("/dogs", async (req, res) => {
  try {
    const { name, weight, height, life_span, temperament, createdInDb } =
      req.body;
    if (!name || !weight || !height)
      return res.status(404).send("faltan campos oblibatorios");
    const postDog = await Dog.create({
      name,
      height,
      weight,
      life_span,
      createdInDb,
    });
    //console.log(temperament)
    if (temperament.length > 0) {
      let temperamentDb = (
        await Promise.all(
          temperament.map(async (temp) => {
            const obj = { name: temp.toLowerCase() };
            return await Temp.findAll({ where: obj });
          })
        )
      ).flat();
      /*   console.log(temperamentDb); */
      await postDog.addTemp(temperamentDb);
      return res.status(200).json(postDog);
    }
    return res.status(200).json(postDog);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
