const Sequelize = require('sequelize');
module.exports = function(RED) {
  function ignitesequelizeNode(config) {
      RED.nodes.createNode(this,config);

      this.database = config.database;
      this.host = config.host;
      this.port = config.port;
      this.ssl = config.ssl;
      this.dialect = config.dialect;
      if (this.credentials) {
        this.username = this.credentials.username;
        this.password = this.credentials.password;
      }
      var node = this;
      node.on('input', function(msg) {
        var sequelize = new Sequelize(node.database,node.username, node.password, {
          host: node.host,
          port: node.port,
          dialect: this.dialect,
          dialectOptions: {
            ssl: node.ssl
          }
        });
        var query = "";
        if(msg.provider === "ignite-odata" && msg.payload.queries[this.dialect])
        {
          query = msg.payload.queries[this.dialect];
        }
        else
        {
          query = msg.payload;
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
}