const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "temp",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING,
      },
    },
    { timestamps: false }
  );
};
