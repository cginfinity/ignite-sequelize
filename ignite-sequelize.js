const Sequelize = require('sequelize');
const mustache = require('mustache');
module.exports = function (RED) {
  'use strict';
  let pgPool = null;

  function databaseNode(n) {
    let poolInstance = null;
    const node = this;

    RED.nodes.createNode(this, n);
    node.name = n.name;
    node.host = n.host;
    node.port = n.port;
    node.database = n.database;
    node.dialect = n.dialect;
    node.ssl = n.ssl;
    if (node.credentials) {
      node.url = node.credentials.url
      node.user = node.credentials.user;
      node.password = node.credentials.password;
    }
  }

  RED.nodes.registerType('database', databaseNode, {
    credentials: {
      url: { type: 'text' },
      user: { type: 'text' },
      password: { type: 'password' }
    }
  });

  function ignitesequelizeNode(config) {
    const node = this;
    RED.nodes.createNode(this, config);
    node.config = RED.nodes.getNode(config.database);
    node.on('input', function (msg) {
      var sequelize;
      if (node.config.url) {
        sequelize = new Sequelize(node.config.url, {
          dialect: node.config.dialect,
          dialectOptions: {
            ssl: node.config.ssl
          },
          logging: false
        });
      }
      else {
        sequelize = new Sequelize(node.config.database, node.config.user, node.config.password, {
          host: node.config.host,
          port: node.config.port,
          dialect: node.config.dialect,
          dialectOptions: {
            ssl: node.config.ssl
          },
          logging: false
        });
      }
      var query = "";
      var binds = msg.sBinds || {};
      if (msg.provider === "ignite-odata" && msg.payload[this.config.dialect]) {
        query = msg.payload[this.config.dialect];
      } else {
        if (config.usepayload) {
          query = msg.payload;
        } else if (msg.sQuery) {
          query = msg.sQuery;
        } else {
          query = mustache.render(config.query, {
            msg: msg
          });
        }
      }
      sequelize.query(query, {
        binds: binds
      })
        .then(([results, metadata]) => {
          msg.payload = results;
          msg.metadata = metadata;
          node.send(msg);
        }, error => {
          msg.payload = [];
          msg.error = error;
          node.send(msg);
        });
    });
  }
  RED.nodes.registerType("sequelize", ignitesequelizeNode, {
    credentials: {
      url: { type: 'password' },
      username: { type: 'text' },
      password: { type: 'password' }
    }
  });
};
