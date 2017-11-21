exports.config = {
    specs: [
        'test/e2e/*.js'
    ],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    },
    allScriptsTimeout: 60000,
    directConnect: true
};
