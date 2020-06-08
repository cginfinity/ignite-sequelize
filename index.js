module.exports = function(RED) {
    function sequelize(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        this.on('input', function(msg) {
            info={
                complete_url: msg.req.url,
                method: msg.req.method,
                resource_path: msg.req._parsedUrl.pathname,
                query_params: msg.req.query,
                body: msg.req.body
            };

            GetQueries(info)
            .then(queries => {
                msg.payload.queries = queries
                msg.payload.info = info
                node.send(msg)
            });
        });
    }
    RED.nodes.registerType("sequelize",sequelize);
};