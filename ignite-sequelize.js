const Sequelize = require('sequelize');
const mustache = require('mustache');
module.exports = function(RED) {
  'use strict';
  let pgPool = null;

  function ignitesequelizeDBNode(n) {
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
      node.user = node.credentials.user;
      node.password = node.credentials.password;
    }
  }

  RED.nodes.registerType('ignitesequelizeDB', ignitesequelizeDBNode, {
    credentials: {
      user: {type: 'text'},
      password: {type: 'password'}
    }
  });

  function ignitesequelizeNode(config) {
    const node = this;
    RED.nodes.createNode(this, config);
    node.config = RED.nodes.getNode(config.ignitesequelizeDB);
    node.on('input', function(msg) {
      var sequelize = new Sequelize( node.config.database, node.config.user,  node.config.password, {
        host:  node.config.host,
        port:  node.config.port,
        dialect:  node.config.dialect,
        dialectOptions: {
          ssl:  node.config.ssl
        }
      });
      var query = "";
      if(msg.provider === "ignite-odata" && msg.payload.queries[this.config.dialect])
      {
        query = msg.payload.queries[this.config.dialect];
      }
      else
      {
        if(config.usepayload){
          query = msg.payload;
        }
        else
        {
          query = mustache.render(config.query, {
            msg: msg
          });
        }
      }
      sequelize.query(query)
      .then(([results, metadata])  => {
        msg.payload = results;
        msg.metadata = metadata;
        node.send(msg);
      }, error=>{
        msg.payload = [];
        msg.error = error;
        node.send(msg);
      });
    });
  }
  RED.nodes.registerType("ignite-sequelize",ignitesequelizeNode,{
    credentials: {
      username: {type: 'text'},
      password: {type: 'password'}
    }
  });
};
