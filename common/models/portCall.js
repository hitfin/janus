'use strict';

module.exports = function(PortCall) {

  PortCall.getRoutes = function(etd, eta, ts, cb) {
    // For more information on how to query data in loopback please see
    // https://docs.strongloop.com/display/public/LB/Querying+data
    const query = {
      where: {
        and: [
          { // port call etd >= etd param, or can be null
            or: [{ etd: { gte: etd } }, { etd: null }]
          },
          { // port call eta <= eta param, or can be null
            or: [{ eta: { lte: eta } }, { eta: null }]
          }
        ]
      }
    };

    PortCall.find(query)
      .then(calls => {

        var voyages = []
        if (!ts) {
          var callsByRoute = calls.reduce((grouped, call) => {
            grouped[call.routeId] = grouped[call.routeId] || [];
            grouped[call.routeId].push(call);
            return grouped;
          }, {});


          for (let routeId of Object.keys(callsByRoute)) {
            let routeCalls = callsByRoute[routeId]

            for (let [index, routeCall] of routeCalls.entries()) {
              for (var destinationIndex = index + 1; destinationIndex < routeCalls.length; destinationIndex++) {
                voyages.push({"routeId": routeId, "startPort": routeCall.port, "destinationPort":routeCalls[destinationIndex].port})
              }
            }
          }
        } else {
          for (let [index, call] of calls.entries()) {
            for (var destinationIndex = index + 1; destinationIndex < calls.length; destinationIndex++) {
              voyages.push({"routeId": call.routeId, "startPort": call.port, "destinationPort":calls[destinationIndex].port})
            }
          }
        }


        return cb(null, voyages);
      })
      .catch(err => {
        console.log(err);

        return cb(err);
      });
  };

  PortCall.remoteMethod('getRoutes', {
    accepts: [
      { arg: 'etd', 'type': 'date' },
      { arg: 'eta', 'type': 'date' },
      { arg: 'ts', 'type': 'boolean'}
    ],
    returns: [
      { arg: 'routes', type: 'array', root: true }
    ]
  });

};
